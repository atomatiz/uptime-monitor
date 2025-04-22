import { Config } from '@common/interfaces';
import { Nullable } from '@common/types';
import { DomainEvent } from '@domain/event';

export abstract class QueueRepository {
    abstract enqueue(
        event: DomainEvent,
        config: Config,
    ): Promise<void | boolean>;
    abstract dequeue(
        aggregateId: string,
        config: Config,
    ): Promise<Nullable<{ event: DomainEvent }>>;
    abstract consume(
        aggregateId: string,
        config: Config,
        callback: (event: DomainEvent) => Promise<void | boolean>,
    ): Promise<void>;
}
