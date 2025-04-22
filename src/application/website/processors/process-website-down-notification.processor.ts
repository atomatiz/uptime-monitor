import { Inject } from '@nestjs/common';
import { Notification } from '@domain/notification';
import { QueueRepository } from '@application/notification/repositories/queue.repository';
import { NotificationRepository } from '@application/notification/repositories/notification.repository';
import { Website } from '@domain/website';
import { BaseNotificationProcessor } from '@application/notification/bases/notification-processor.base';
import aggregateStore from '@domain/aggregate-store';
import { CommandBus } from '@nestjs/cqrs';
import { RestartHostCommand } from '@domain/host/commands/restart-host.command';
import { Optional } from '@common/types';

export class ProcessWebsiteDownNotificationProcessor extends BaseNotificationProcessor<Website> {
    constructor(
        @Inject('QUEUE_REPOSITORY') queueRepository: QueueRepository,
        @Inject('NOTIFICATION_REPOSITORY')
        notificationRepository: NotificationRepository,
        private readonly commandBus: CommandBus,
    ) {
        super(queueRepository, notificationRepository);
    }

    protected getRelatedAggregate(
        notification: Notification,
    ): Optional<Website> {
        return aggregateStore.get<Website>(notification?.correlationId!);
    }

    protected finalize(website: Website, notification: Notification): void {
        notification.markAsSent();
        notification.wipe();
        website.markWebsiteDownNotificationSent();
        this.commandBus.execute(new RestartHostCommand(website.host.id));
    }
}
