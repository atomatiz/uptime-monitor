import { HOST_EVENT_NAMES } from '@common/domains/host';
import { DomainEvent } from '@domain/event';

export class HostManualInterventionEvent implements DomainEvent {
    public readonly eventName = HOST_EVENT_NAMES.HOST_MANUAL_INTERVENTION_EVENT;
    constructor(
        public readonly aggregateId: string,
        public readonly timestamp: Date = new Date(),
    ) {}
}
