import { CommandBus, EventsHandler, IEventHandler } from '@nestjs/cqrs';
import { WebsiteUpEvent } from '@domain/website/events/website-up.event';
import aggregateStore from '@domain/aggregate-store';
import { SendNotificationCommand } from '@domain/notification/commands/send-notification.command';
import { Website } from '@domain/website';
import { DOMAIN_TYPE } from '@common/types';
import { DOMAINS } from '@common/constants';

@EventsHandler(WebsiteUpEvent)
export class WebsiteUpEventHandler implements IEventHandler<WebsiteUpEvent> {
    private readonly domainType: DOMAIN_TYPE = DOMAINS.WEBSITE;

    constructor(private readonly commandBus: CommandBus) {}

    async handle(event: WebsiteUpEvent): Promise<void> {
        const website = aggregateStore.get<Website>(event.aggregateId);
        if (!website) {
            throw new Error(`No website found with ID: ${event.aggregateId}`);
        }
        this.commandBus.execute(
            new SendNotificationCommand(
                website?.id || '',
                this.domainType,
                event.eventName,
            ),
        );
    }
}
