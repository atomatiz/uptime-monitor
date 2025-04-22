import { DomainEvent } from '@domain/event';
import { Producer, Consumer } from 'kafkajs';
import { Channel } from 'amqplib';
import { Nullable } from '@common/types';

interface IEnqueueDTO {
    [key: string]: Producer | Channel | DomainEvent | string;
}

interface IDequeueDTO {
    [key: string]: Channel | string;
}

interface IConsumeDTO {
    [key: string]: Consumer | Channel | string;
}

export abstract class IQueueClient {
    abstract enqueue(payload: IEnqueueDTO): Promise<void>;
    abstract dequeue(
        payload?: Nullable<IDequeueDTO>,
    ): Promise<Nullable<{ event: DomainEvent }>>;
    abstract consume(
        payload: IConsumeDTO,
        callback: (event: DomainEvent) => Promise<void>,
    ): Promise<void>;
}
