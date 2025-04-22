import { CommandBus, EventsHandler, IEventHandler } from '@nestjs/cqrs';
import { WebsiteDownEvent } from '@domain/website/events/website-down.event';
import aggregateStore from '@domain/aggregate-store';
import { Website } from '@domain/website';
import { DOMAIN_TYPE } from '@common/types';
import { DOMAINS } from '@common/constants';
import { SendNotificationCommand } from '@domain/notification/commands/send-notification.command';

@EventsHandler(WebsiteDownEvent)
export class WebsiteDownEventHandler
    implements IEventHandler<WebsiteDownEvent>
{
    private readonly domainType: DOMAIN_TYPE = DOMAINS.WEBSITE;
    constructor(private readonly commandBus: CommandBus) {}

    async handle(event: WebsiteDownEvent): Promise<void> {
        const website = aggregateStore.get<Website>(event.aggregateId);
        if (!website) {
            throw new Error(`No website found with ID: ${event.aggregateId}`);
        }
        this.commandBus.execute(
            new SendNotificationCommand(
                website.id,
                this.domainType,
                event.eventName,
            ),
        );
    }
}
