import { DOMAINS } from '@common/constants';
import { DOMAIN_TYPE } from '@common/types';
import aggregateStore from '@domain/aggregate-store';
import { Host, HostManualInterventionEvent } from '@domain/host';
import { SendNotificationCommand } from '@domain/notification/commands/send-notification.command';
import { EventsHandler, IEventHandler, CommandBus } from '@nestjs/cqrs';

@EventsHandler(HostManualInterventionEvent)
export class HostManualInterventionEventHandler
    implements IEventHandler<HostManualInterventionEvent>
{
    private readonly domainType: DOMAIN_TYPE = DOMAINS.HOST;

    constructor(private readonly commandBus: CommandBus) {}

    async handle(event: HostManualInterventionEvent): Promise<void> {
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
