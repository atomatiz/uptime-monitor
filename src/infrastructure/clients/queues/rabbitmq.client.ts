import { Channel } from 'amqplib';
import { IQueueClient } from '@common/domains/notification/interfaces/queue.interface';
import { LoggingService } from '@core/logging.service';
import { DomainEvent } from '@domain/event';
import { errorMessage } from '@common/utils';

export class RabbitMQClient extends IQueueClient {
    private readonly logger = new LoggingService(RabbitMQClient.name);

    async enqueue({
        channel,
        appId,
        queueName,
        exchangeName,
        exchangeKey,
        event,
    }: {
        channel: Channel;
        appId: string;
        queueName: string;
        exchangeName: string;
        exchangeKey: string;
        event: DomainEvent;
    }): Promise<void> {
        try {
            const message = Buffer.from(JSON.stringify(event));
            channel.publish(exchangeName, exchangeKey, message, {
                appId: appId,
                replyTo: queueName,
                correlationId: crypto.randomUUID(),
                persistent: true,
                expiration: 60000,
            });
            this.logger.debug(`Enqueued event ${event.eventName}`);
        } catch (error: unknown) {
            this.logger.error(
                errorMessage(`Error enqueueing RabbitMQ message`),
            );
        }
    }

    async dequeue({
        channel,
        queueName,
    }: {
        channel: Channel;
        queueName: string;
    }): Promise<{ event: DomainEvent } | null> {
        try {
            const msg = await channel.get(queueName, { noAck: false });
            if (!msg) return null;
            const event = JSON.parse(msg.content.toString()) as DomainEvent;
            channel.ack(msg);
            this.logger.debug(`Dequeued event ${event.eventName}`);
            return { event };
        } catch (error: unknown) {
            this.logger.error(
                errorMessage(`Error enqueueing RabbitMQ message`),
            );
            return null;
        }
    }

    async consume(
        { channel, queueName }: { channel: Channel; queueName: string },
        callback: (event: DomainEvent) => Promise<void>,
    ): Promise<void> {
        try {
            await channel.consume(
                queueName,
                async (msg) => {
                    if (msg) {
                        const event = JSON.parse(
                            msg.content.toString(),
                        ) as DomainEvent;
                        await callback(event)
                            .then(() => {
                                channel.ack(msg);
                                this.logger.log(
                                    `Event consumed from RabbitMQ: ${event.eventName}`,
                                );
                            })
                            .catch(() => {
                                channel.nack(msg, false, true);
                            });
                    }
                },
                { noAck: false },
            );
        } catch (error: unknown) {
            this.logger.error(
                errorMessage('Error consuming RabbitMQ message', error),
            );
        }
    }
}
