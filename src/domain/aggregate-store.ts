import { IncludeDomainEvents } from './event';

class AggregateStore {
    private readonly aggregates = new Map<string, unknown>();

    get<T extends IncludeDomainEvents>(id: string): T | undefined {
        return this.aggregates.get(id) as T | undefined;
    }

    getAll<T extends IncludeDomainEvents>(): T[] {
        return Array.from(this.aggregates.values()) as T[];
    }

    set<T extends IncludeDomainEvents>(aggregate: T): void {
        this.aggregates.set(aggregate.id, aggregate);
    }

    delete(aggregateId: string): void {
        this.aggregates.delete(aggregateId);
    }
}

export default new AggregateStore();
