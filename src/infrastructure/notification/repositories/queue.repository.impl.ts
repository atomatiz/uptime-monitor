import { Injectable } from '@nestjs/common';
import { LoggingService } from '@core/logging.service';
import { DomainEvent } from '@domain/event';
import { KafkaClient } from '@infrastructure/clients/queues/kafka.client';
import { RabbitMQClient } from '@infrastructure/clients/queues/rabbitmq.client';
import {
    NOTIFICATION_CHANNELS,
    QUEUE_TYPES,
} from '@common/domains/notification/constants/notification.constants';
import { Config } from '@common/interfaces';
import { QueueRepository } from '@application/notification/repositories/queue.repository';
import { connect, Channel, ChannelModel } from 'amqplib';
import { Kafka, Producer, Consumer, Admin } from 'kafkajs';
import { errorMessage } from '@common/utils';
import { hasAnyKey } from '@common/utils/type-check.util';
import { NotificationMapper } from '../mapper/notification.mapper';
import { Nullable } from '@common/types';
import { QUEUE_TYPE } from '@common/domains/notification';
interface IQueueClient {
    rabbitmq?: { connection: ChannelModel; channel: Channel };
    kafka?: { producer: Producer; consumer: Consumer; admin?: Admin };
}
@Injectable()
export class QueueRepositoryImpl extends QueueRepository {
    private readonly logger = new LoggingService(QueueRepositoryImpl.name);
    private clientConfigMap: Map<string, IQueueClient> = new Map();
    private clientsMap: Map<
        string,
        Nullable<Array<KafkaClient | RabbitMQClient>>
    > = new Map();
    private readonly kafkaClientId = 'uptime-monitor';
    private readonly kafkaTopic = 'uptime-monitor-topic';
    private readonly kafkaGroupId = 'uptime-monitor-group';
    private readonly rmqAppId = 'uptime-monitor';
    private readonly rmqQueueName = 'uptime-monitor';
    private readonly rmqQueueExchange = 'uptime-monitor-exchange';
    private readonly reconnectDelay = 5000;
    private readonly maxReconnectAttempts = 5;
    constructor(
        private readonly kafkaClient: KafkaClient,
        private readonly rabbitmqClient: RabbitMQClient,
    ) {
        super();
    }
    private async storeQueueClients(
        aggregateId: string,
        config: Config,
        attempt: number = 0,
    ): Promise<void> {
        if (
            this.clientConfigMap.has(aggregateId) &&
            this.clientsMap.has(aggregateId)
        ) {
            return;
        }
        const clients: Array<KafkaClient | RabbitMQClient> = [];
        if (!config) {
            throw new Error(`No configuration found for ID: ${aggregateId}`);
        }
        const queueConfig = config.channels.find(
            (c) => c.type === NOTIFICATION_CHANNELS.QUEUE,
        )?.queues;
        if (!queueConfig) {
            this.logger.warn(
                `No queue configuration found for ID: ${aggregateId}`,
            );
            return;
        }
        try {
            if (queueConfig.kafka && queueConfig.kafkaBroker) {
                clients.push(this.kafkaClient);
                const kafka = new Kafka({
                    clientId: this.kafkaClientId,
                    brokers: [queueConfig.kafkaBroker],
                });
                const producer = kafka.producer();
                await producer.connect();
                producer.on(producer.events.DISCONNECT, async () => {
                    this.logger.warn(
                        `Kafka producer disconnected -> ID: ${aggregateId}`,
                    );
                    await this.reconnect(
                        aggregateId,
                        config,
                        QUEUE_TYPES.KAFKA,
                    );
                });
                producer.on(producer.events.REQUEST_TIMEOUT, async (error) => {
                    this.logger.error(
                        errorMessage(
                            `Kafka producer network error -> ID: ${aggregateId}`,
                            error,
                        ),
                    );
                    await this.reconnect(
                        aggregateId,
                        config,
                        QUEUE_TYPES.KAFKA,
                    );
                });
                const consumer = kafka.consumer({
                    groupId: `${this.kafkaGroupId}-${aggregateId}`,
                });
                await consumer.connect();
                await consumer.subscribe({
                    topic: `${this.kafkaTopic}-${aggregateId}`,
                    fromBeginning: true,
                });
                consumer.on(consumer.events.DISCONNECT, async () => {
                    this.logger.warn(
                        `Kafka consumer disconnected -> ID: ${aggregateId}`,
                    );
                    await this.reconnect(
                        aggregateId,
                        config,
                        QUEUE_TYPES.KAFKA,
                    );
                });
                consumer.on(consumer.events.REQUEST_TIMEOUT, async (error) => {
                    this.logger.error(
                        errorMessage(
                            `Kafka consumer network error -> ID: ${aggregateId}`,
                            error,
                        ),
                    );
                    await this.reconnect(
                        aggregateId,
                        config,
                        QUEUE_TYPES.KAFKA,
                    );
                });
                const admin = kafka.admin();
                await admin.connect();
                this.clientConfigMap.set(aggregateId, {
                    kafka: { producer, consumer, admin },
                });
                this.logger.log(
                    `Kafka client initialized for ${this.kafkaGroupId}-${aggregateId}`,
                );
            }
            if (queueConfig.rabbitmq && queueConfig.rabbitmqBroker) {
                clients.push(this.rabbitmqClient);
                const connection = await connect(queueConfig.rabbitmqBroker);
                const channel = await connection.createChannel();
                await channel.assertExchange(this.rmqQueueExchange, 'direct', {
                    durable: true,
                });
                await channel.assertQueue(
                    `${this.rmqQueueName}-${aggregateId}`,
                    { messageTtl: 60000, durable: true },
                );
                await channel.bindQueue(
                    `${this.rmqQueueName}-${aggregateId}`,
                    this.rmqQueueExchange,
                    aggregateId,
                );
                connection.on('error', async (err) => {
                    this.logger.error(
                        `RabbitMQ connection error -> ID: ${aggregateId}`,
                        err,
                    );
                    await this.reconnect(
                        aggregateId,
                        config,
                        QUEUE_TYPES.RABBITMQ,
                    );
                });
                connection.on('close', async () => {
                    this.logger.warn(
                        `RabbitMQ connection closed -> ID: ${aggregateId}`,
                    );
                    await this.reconnect(
                        aggregateId,
                        config,
                        QUEUE_TYPES.RABBITMQ,
                    );
                });
                this.clientConfigMap.set(aggregateId, {
                    rabbitmq: { connection, channel },
                });
                this.logger.log(
                    `RabbitMQ client initialized for ${this.rmqQueueName}-${aggregateId}`,
                );
            }
            if (clients.length === 0) {
                this.logger.warn(
                    `No queue client configured for ID: ${aggregateId}`,
                );
            }
            this.clientsMap.set(aggregateId, clients);
        } catch (error: unknown) {
            if (attempt >= this.maxReconnectAttempts) {
                this.logger.error(
                    errorMessage(
                        `Max reconnect attempts reached for ID: ${aggregateId}`,
                        error,
                    ),
                );
                return;
            }
            this.logger.warn(
                `Connection failed (attempt ${attempt}/${this.maxReconnectAttempts}), retrying in ${this.reconnectDelay / 1000} seconds...`,
            );
            await new Promise((resolve) =>
                setTimeout(resolve, this.reconnectDelay),
            );
            await this.storeQueueClients(aggregateId, config, attempt + 1);
        }
    }
    private async reconnect(
        aggregateId: string,
        config: Config,
        type: QUEUE_TYPE,
    ): Promise<void> {
        const clientData = this.clientConfigMap.get(aggregateId);
        if (clientData) {
            if (type === QUEUE_TYPES.KAFKA && clientData.kafka) {
                await clientData.kafka.producer.disconnect().catch(() => {});
                await clientData.kafka.consumer.disconnect().catch(() => {});
            } else if (type === QUEUE_TYPES.RABBITMQ && clientData.rabbitmq) {
                await clientData.rabbitmq.channel.close().catch(() => {});
                await clientData.rabbitmq.connection.close().catch(() => {});
            }
            this.clientConfigMap.delete(aggregateId);
            this.clientsMap.delete(aggregateId);
        }
        await this.storeQueueClients(aggregateId, config);
    }
    async enqueue(event: DomainEvent, config: Config): Promise<void | boolean> {
        const { aggregateId } = event;
        await this.storeQueueClients(aggregateId, config);
        const clients = this.clientsMap.get(aggregateId);
        const clientData = this.clientConfigMap.get(aggregateId);
        if (!clients || !clients.length || !clientData) {
            throw new Error(
                `No queue client ${!clients || !clients.length ? 'configs' : !clientData ? 'data' : 'configs and data'} found for ID: ${aggregateId}`,
            );
        }
        const { kafka, rabbitmq } = clientData;
        if (
            !Array.isArray(clients) &&
            !hasAnyKey<IQueueClient>(clientData, ['kafka', 'rabbitmq'])
        ) {
            return NotificationMapper.toDomain(false);
        }
        const enqueueTasks = clients.map(async (client) => {
            let payload;
            if (client instanceof KafkaClient) {
                payload = {
                    producer: kafka?.producer as Producer,
                    topic: this.kafkaTopic + `-${aggregateId}`,
                    event: event,
                };
            }
            if (client instanceof RabbitMQClient) {
                payload = {
                    channel: rabbitmq?.channel as Channel,
                    appId: this.rmqAppId,
                    queueName: this.rmqQueueName + `-${aggregateId}`,
                    exchangeName: this.rmqQueueExchange,
                    exchangeKey: aggregateId,
                    event: event,
                };
            }
            try {
                await client.enqueue(payload);
                this.logger.log(
                    `Event ${event.eventName} enqueued to ${client.constructor.name} for ID: ${aggregateId}`,
                );
            } catch (error: unknown) {
                this.logger.error(
                    errorMessage(
                        `Error enqueueing event ${event.eventName} to ${client.constructor.name} for ID: ${aggregateId}`,
                        error,
                    ),
                );
                return NotificationMapper.toDomain(false);
            }
        });
        await Promise.all(enqueueTasks);
        this.logger.log(
            `Event ${event.eventName} enqueued to ${clients.length} queue client(s) for ID: ${aggregateId}`,
        );
        return NotificationMapper.toDomain(true);
    }
    async dequeue(
        aggregateId: string,
        config: Config,
    ): Promise<{ event: DomainEvent } | null> {
        await this.storeQueueClients(aggregateId, config);
        const clients = this.clientsMap.get(aggregateId);
        const clientData = this.clientConfigMap.get(aggregateId);
        if (!clients || !clients.length || !clientData) {
            throw new Error(
                `No queue client ${!clients || !clients.length ? 'configs' : !clientData ? 'data' : 'configs and data'} found for ID: ${aggregateId}`,
            );
        }
        const { rabbitmq } = clientData;
        if (
            !Array.isArray(clients) &&
            !hasAnyKey<IQueueClient>(clientData, ['kafka', 'rabbitmq'])
        ) {
            return NotificationMapper.toDomain(null);
        }
        for (const client of clients) {
            if (!(client instanceof RabbitMQClient)) {
                continue;
            }
            try {
                const payload = {
                    channel: rabbitmq?.channel as Channel,
                    queueName: this.rmqQueueName + `-${aggregateId}`,
                };
                const result = await client.dequeue(payload);
                if (!result) {
                    return NotificationMapper.toDomain(null);
                }
                this.logger.log(
                    `Event ${result.event.eventName} dequeued from ${client.constructor.name} for ID: ${aggregateId}`,
                );
                return result;
            } catch (error: unknown) {
                this.logger.error(
                    errorMessage(
                        `Error dequeuing from ${client.constructor.name} for ID ${aggregateId}`,
                        error,
                    ),
                );
                return NotificationMapper.toDomain(null);
            }
        }
        return NotificationMapper.toDomain(null);
    }
    async consume(
        aggregateId: string,
        config: Config,
        callback: (event: DomainEvent) => Promise<void | boolean>,
    ): Promise<void> {
        await this.storeQueueClients(aggregateId, config);
        const clients = this.clientsMap.get(aggregateId);
        const clientData = this.clientConfigMap.get(aggregateId);
        if (!clients || !clients.length || !clientData) {
            throw new Error(
                `No queue client ${!clients || !clients.length ? 'configs' : !clientData ? 'data' : 'configs and data'} found for ID: ${aggregateId}`,
            );
        }
        const { kafka, rabbitmq } = clientData;
        if (
            !Array.isArray(clients) &&
            !hasAnyKey<IQueueClient>(clientData, ['kafka', 'rabbitmq'])
        ) {
            return;
        }
        const consumeTasks = clients.map(async (client) => {
            let payload;
            let consumerTag: string | undefined;
            if (client instanceof KafkaClient) {
                payload = { consumer: kafka?.consumer as Consumer };
            }
            if (client instanceof RabbitMQClient) {
                payload = {
                    channel: rabbitmq?.channel as Channel,
                    queueName: this.rmqQueueName + `-${aggregateId}`,
                    noAck: true,
                };
            }
            try {
                const wrappedCallback = async (event: DomainEvent) => {
                    this.logger.debug(
                        `Processing event ${event.eventName} from ${client.constructor.name} for ID: ${aggregateId}`,
                    );
                    await callback(event);
                    if (client instanceof KafkaClient && kafka?.admin) {
                        const topic = `${this.kafkaTopic}-${aggregateId}`;
                        try {
                            await kafka.consumer.disconnect();
                            await kafka.admin.deleteTopics({ topics: [topic] });
                        } catch (error: unknown) {
                            this.logger.error(
                                errorMessage(
                                    `Failed to delete Kafka topic ${topic}`,
                                    error,
                                ),
                            );
                        }
                        await kafka.consumer.disconnect();
                    }
                    if (client instanceof RabbitMQClient && rabbitmq?.channel) {
                        const queueName = `${this.rmqQueueName}-${aggregateId}`;
                        try {
                            if (consumerTag) {
                                await rabbitmq.channel.cancel(consumerTag);
                            }
                            await rabbitmq.channel.deleteQueue(queueName);
                            await rabbitmq.channel.close();
                        } catch (error: unknown) {
                            this.logger.error(
                                errorMessage(
                                    `Failed to delete RabbitMQ queue ${queueName}`,
                                    error,
                                ),
                            );
                        }
                    }
                };

                if (client instanceof RabbitMQClient && rabbitmq?.channel) {
                    const { consumerTag: tag } = await rabbitmq.channel.consume(
                        payload.queueName,
                        async (msg) => {
                            if (msg) {
                                const event = JSON.parse(
                                    msg.content.toString(),
                                ) as DomainEvent;
                                await wrappedCallback(event);
                            }
                        },
                        { noAck: true },
                    );
                    consumerTag = tag;
                } else {
                    await client.consume(payload, wrappedCallback);
                }
                this.logger.log(
                    `Queue consumer started for ${client.constructor.name} for ID: ${aggregateId}`,
                );
            } catch (error: unknown) {
                this.logger.error(
                    errorMessage(
                        `Error setting up consumer for ${client.constructor.name} for ID: ${aggregateId}`,
                        error,
                    ),
                );
            }
        });
        await Promise.all(consumeTasks);
        this.logger.log(
            `Queue consumers started for ${clients.length} client(s) for ID: ${aggregateId}`,
        );
    }
}
