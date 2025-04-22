import { HOST_EVENT_NAMES } from '@common/domains/host';
import { DomainEvent } from '@domain/event';

export class HostRestartedEvent implements DomainEvent {
    public readonly eventName = HOST_EVENT_NAMES.HOST_RESTARTED_EVENT;
    constructor(
        public readonly aggregateId: string,
        public readonly timestamp: Date = new Date(),
    ) {}
}
