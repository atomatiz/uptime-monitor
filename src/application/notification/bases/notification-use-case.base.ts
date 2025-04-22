import { CommandBus } from '@nestjs/cqrs';
import { LoggingService } from '@core/logging.service';
import { Config, UseCase } from '@common/interfaces';
import aggregateStore from '@domain/aggregate-store';
import { Notification } from '@domain/notification';
import { QueueRepository } from '@application/notification/repositories/queue.repository';
import { ProcessQueueCommand } from '@domain/notification/commands/process-queue.command';
import { DOMAIN_TYPE, Optional } from '@common/types';
import { IncludeDomainEvents } from '@domain/event';

export abstract class BaseNotificationUseCase<T extends IncludeDomainEvents>
    implements UseCase<string, void>
{
    protected readonly logger: LoggingService = new LoggingService(
        this.constructor.name,
    );
    protected abstract readonly domainType: DOMAIN_TYPE;

    constructor(
        protected readonly queueRepository: QueueRepository,
        protected readonly commandBus: CommandBus,
    ) {}

    async execute(
        aggregateId: string,
        config: Config,
        eventName: string,
    ): Promise<void> {
        const aggregate = aggregateStore.get<T>(aggregateId);
        if (!aggregate) {
            this.logger.warn(`No aggregate found with ID: ${aggregateId}`);
            return;
        }

        const notification = this.createNotification(aggregate, config);
        if (!notification) {
            this.logger.warn(`No notification created with ID: ${aggregateId}`);
            return;
        }

        await this.enqueueNotification(notification, config, eventName);
        this.finalizeEnqueue(aggregate, notification, eventName);
    }

    protected abstract createNotification(
        aggregate: T,
        config: Config,
    ): Optional<Notification>;

    protected async enqueueNotification(
        notification: Notification,
        config: Config,
        eventName: string,
    ): Promise<void | boolean> {
        const isEnqueued = await this.queueRepository.enqueue(
            {
                aggregateId: notification.id,
                eventName,
            },
            config,
        );
        aggregateStore.set(notification);
        return isEnqueued;
    }

    protected finalizeEnqueue(
        aggregate: T,
        notification: Notification,
        eventName: string,
    ): void {
        notification.markAsPending();
        this.commandBus.execute(
            new ProcessQueueCommand(
                notification.id,
                this.domainType,
                eventName,
            ),
        );
    }
}
