import { CommandHandler, ICommandHandler } from '@nestjs/cqrs';
import { DOMAINS } from '@common/constants';
import { SendNotificationCommand } from '@domain/notification/commands/send-notification.command';
import { SendWebsiteNotificationUseCase } from '../use-cases/send-website-notification.use-case';
import { SendHostNotificationUseCase } from '../use-cases/send-host-notification.use-case';

@CommandHandler(SendNotificationCommand)
export class SendNotificationCommandHandler
    implements ICommandHandler<SendNotificationCommand>
{
    constructor(
        private readonly sendWebsiteNotificationUseCase: SendWebsiteNotificationUseCase,
        private readonly sendHostNotificationUseCase: SendHostNotificationUseCase,
    ) {}

    async execute(command: SendNotificationCommand): Promise<void> {
        const { aggregateId, eventName, domainType } = command;
        switch (domainType) {
            case DOMAINS.WEBSITE:
                await this.sendWebsiteNotificationUseCase.execute(
                    aggregateId,
                    eventName || '',
                );
                break;

            case DOMAINS.HOST:
                await this.sendHostNotificationUseCase.execute(
                    aggregateId,
                    eventName || '',
                );
                break;

            case DOMAINS.NOTIFICATION:
                break;

            default:
                throw new Error(
                    `Unsupported domain type for ID: ${aggregateId}`,
                );
        }
    }
}
