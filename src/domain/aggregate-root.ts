import { Entity, EntityProps } from './entity';
import { DomainEvent, IncludeDomainEvents } from './event';
import AggregateStore from './aggregate-store';
import { DEFAULT_SYSTEM_ROLE } from '@common/constants';

export default abstract class AggregateRoot<TProps extends EntityProps>
    extends Entity<TProps>
    implements IncludeDomainEvents
{
    private readonly _domainEvents: DomainEvent[] = [];

    constructor(props: TProps, id?: string) {
        super(props, id);
    }

    protected updateTimestamp(updater?: string): void {
        this.props.updatedAt = new Date();
        this.props.updatedBy = updater ?? DEFAULT_SYSTEM_ROLE;
        AggregateStore.set(this);
    }

    get domainEvents(): ReadonlyArray<DomainEvent> {
        return [...this._domainEvents];
    }

    getDomainEventById(aggregateId: string): DomainEvent | undefined {
        return this._domainEvents.find(
            (event) => event.aggregateId === aggregateId,
        );
    }

    registerDomainEvent(event: DomainEvent): void {
        this._domainEvents.push(event);
        AggregateStore.set(this);
    }

    deleteDomainEventById(aggregateId: string): boolean {
        const index = this._domainEvents.findIndex(
            (event) => event.aggregateId === aggregateId,
        );
        if (index !== -1) {
            this._domainEvents.splice(index, 1);
            AggregateStore.set(this);
            return true;
        }
        return false;
    }

    softClearDomainEvents(): void {
        this._domainEvents.splice(0, this._domainEvents.length);
        AggregateStore.set(this);
    }

    wipe(): void {
        AggregateStore.delete(this.id);
    }
}
