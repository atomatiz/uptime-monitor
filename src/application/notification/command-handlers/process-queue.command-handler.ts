import { CommandHandler, ICommandHandler } from '@nestjs/cqrs';
import { DOMAINS } from '@common/constants';
import { ProcessQueueCommand } from '@domain/notification/commands/process-queue.command';
import { ProcessWebsiteQueueProcessor } from '../processors/process-website-queue.processor';
import { ProcessHostQueueProcessor } from '../processors/process-host-queue.processor';

@CommandHandler(ProcessQueueCommand)
export class ProcessQueueCommandHandler
    implements ICommandHandler<ProcessQueueCommand>
{
    constructor(
        private readonly processWebsiteQueueProcessor: ProcessWebsiteQueueProcessor,
        private readonly processHostQueueProcessor: ProcessHostQueueProcessor,
    ) {}

    async execute(command: ProcessQueueCommand): Promise<void> {
        const { aggregateId, domainType, eventName } = command;
        switch (domainType) {
            case DOMAINS.WEBSITE:
                await this.processWebsiteQueueProcessor.execute(
                    aggregateId,
                    eventName,
                );
                break;

            case DOMAINS.HOST:
                await this.processHostQueueProcessor.execute(
                    aggregateId,
                    eventName,
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
