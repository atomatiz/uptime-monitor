import { WEBSITE_EVENT_NAMES } from '@common/domains/website';
import { DomainEvent } from '@domain/event';

export class WebsiteDownEvent implements DomainEvent {
    public readonly eventName = WEBSITE_EVENT_NAMES.WEBSITE_DOWN_EVENT;
    constructor(
        public readonly aggregateId: string,
        public readonly timestamp: Date = new Date(),
    ) {}
}
