import { WEBSITE_EVENT_NAMES } from '@common/domains/website';
import { DomainEvent } from '@domain/event';

export class WebsiteUpEvent implements DomainEvent {
    public readonly eventName = WEBSITE_EVENT_NAMES.WEBSITE_UP_EVENT;
    constructor(
        public readonly aggregateId: string,
        public readonly timestamp: Date = new Date(),
    ) {}
}
