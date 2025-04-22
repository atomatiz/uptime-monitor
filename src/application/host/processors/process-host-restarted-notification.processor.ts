import { Inject } from '@nestjs/common';
import { Notification } from '@domain/notification';
import { QueueRepository } from '@application/notification/repositories/queue.repository';
import { NotificationRepository } from '@application/notification/repositories/notification.repository';
import { Host } from '@domain/host';
import { BaseNotificationProcessor } from '@application/notification/bases/notification-processor.base';
import aggregateStore from '@domain/aggregate-store';
import { Optional } from '@common/types';

export class ProcessHostRestartedNotificationProcessor extends BaseNotificationProcessor<Host> {
    constructor(
        @Inject('QUEUE_REPOSITORY') queueRepository: QueueRepository,
        @Inject('NOTIFICATION_REPOSITORY')
        notificationRepository: NotificationRepository,
    ) {
        super(queueRepository, notificationRepository);
    }

    protected getRelatedAggregate(notification: Notification): Optional<Host> {
        return aggregateStore.get<Host>(notification?.correlationId!);
    }

    protected finalize(host: Host, notification: Notification): void {
        notification.markAsSent();
        notification.wipe();
        host.markAsRestartedNotificationSent();
    }
}
