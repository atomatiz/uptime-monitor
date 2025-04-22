import { Inject } from '@nestjs/common';
import { Notification } from '@domain/notification';
import { QueueRepository } from '@application/notification/repositories/queue.repository';
import { NotificationRepository } from '@application/notification/repositories/notification.repository';
import { Website } from '@domain/website';
import { BaseNotificationProcessor } from '@application/notification/bases/notification-processor.base';
import aggregateStore from '@domain/aggregate-store';
import { Optional } from '@common/types';

export class ProcessWebsiteUpNotificationProcessor extends BaseNotificationProcessor<Website> {
    constructor(
        @Inject('QUEUE_REPOSITORY') queueRepository: QueueRepository,
        @Inject('NOTIFICATION_REPOSITORY')
        notificationRepository: NotificationRepository,
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
        website.markWebsiteUpNotificationSent();
        website.host.resetState();
        website.resetState();
    }
}
