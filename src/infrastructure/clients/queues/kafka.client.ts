import { Producer, Consumer } from 'kafkajs';
import { IQueueClient } from '@common/domains/notification/interfaces/queue.interface';
import { LoggingService } from '@core/logging.service';
import { DomainEvent } from '@domain/event';
import { errorMessage } from '@common/utils';

export class KafkaClient implements IQueueClient {
    private readonly logger = new LoggingService(KafkaClient.name);

    async enqueue({
        producer,
        topic,
        event,
    }: {
        producer: Producer;
        topic: string;
        event: DomainEvent;
    }): Promise<void> {
        try {
            await producer.send({
                topic: topic,
                messages: [
                    {
                        key: event.aggregateId,
                        value: JSON.stringify(event),
                        timestamp: Date.now().toString(),
                    },
                ],
            });
            this.logger.debug(`Enqueued event: ${event.eventName}`);
        } catch (error: unknown) {
            this.logger.error(
                errorMessage(`Error enqueueing Kafka message`, error),
            );
        }
    }

    async dequeue(): Promise<{ event: DomainEvent } | null> {
        return null;
    }

    async consume(
        { consumer }: { consumer: Consumer },
        callback: (event: DomainEvent) => Promise<void>,
    ): Promise<void> {
        try {
            let eventName: string = '';
            await consumer.run({
                eachMessage: async ({ topic, partition, message }) => {
                    if (!message) {
                        this.logger.log(`Kafka received 0 message`);
                        return;
                    }
                    const event = JSON.parse(
                        message.value!.toString(),
                    ) as DomainEvent;
                    const messageTime = parseInt(message.timestamp, 10);
                    const ttl = 1 * 60 * 1000;
                    if (Date.now() - messageTime > ttl) {
                        this.logger.warn(
                            `Skipping expired message: ${message.value}`,
                        );
                        return;
                    }
                    eventName = event.eventName;
                    await callback(event).then(async () => {
                        await consumer.commitOffsets([
                            {
                                topic,
                                partition,
                                offset: (Number(message.offset) + 1).toString(),
                            },
                        ]);
                    });
                },
            });
            this.logger.log(`Kafka consumer started for event: ${eventName}`);
        } catch (error: unknown) {
            this.logger.error(
                errorMessage(`Error consuming Kafka message`, error),
            );
        }
    }
}
