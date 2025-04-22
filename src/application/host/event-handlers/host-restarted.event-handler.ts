import { CommandBus, EventsHandler, IEventHandler } from '@nestjs/cqrs';
import aggregateStore from '@domain/aggregate-store';
import { DOMAIN_TYPE } from '@common/types';
import { DOMAINS } from '@common/constants';
import { SendNotificationCommand } from '@domain/notification/commands/send-notification.command';
import { Host, HostRestartedEvent } from '@domain/host';

@EventsHandler(HostRestartedEvent)
export class HostRestartedEventHandler
    implements IEventHandler<HostRestartedEvent>
{
    private readonly domainType: DOMAIN_TYPE = DOMAINS.HOST;

    constructor(private readonly commandBus: CommandBus) {}

    async handle(event: HostRestartedEvent): Promise<void> {
        const host = aggregateStore.get<Host>(event.aggregateId);
        if (!host) {
            throw new Error(`No host found with ID: ${event.aggregateId}`);
        }
        this.commandBus.execute(
            new SendNotificationCommand(
                host?.id || '',
                this.domainType,
                event.eventName,
            ),
        );
    }
}
