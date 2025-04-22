import { LoggingService } from '@core/logging.service';
import { Config } from '@common/interfaces';
import aggregateStore from '@domain/aggregate-store';
import { Notification } from '@domain/notification';
import { QueueRepository } from '@application/notification/repositories/queue.repository';
import { NotificationRepository } from '@application/notification/repositories/notification.repository';
import { NOTIFICATION_CHANNELS } from '@common/domains/notification';
import { DomainEvent, IncludeDomainEvents } from '@domain/event';
import { Optional } from '@common/types';

export abstract class BaseNotificationProcessor<T extends IncludeDomainEvents> {
    protected readonly logger: LoggingService = new LoggingService(
        this.constructor.name,
    );

    constructor(
        protected readonly queueRepository: QueueRepository,
        protected readonly notificationRepository: NotificationRepository,
    ) {}

    async execute(
        aggregateId: string,
        config: Config,
        eventName: string,
    ): Promise<void> {
        const notification = aggregateStore.get<Notification>(aggregateId);
        const aggregate = this.getRelatedAggregate(notification!);
        if (!aggregate) {
            this.logger.warn(
                `No related aggregate found for notification ID: ${aggregateId}`,
            );
            return;
        }

        await this.processNotification(
            notification!,
            aggregateId,
            config,
            eventName,
        );
        this.finalize(aggregate, notification!);
    }

    protected abstract getRelatedAggregate(
        notification: Notification,
    ): Optional<T>;

    protected async processNotification(
        notification: Notification,
        aggregateId: string,
        config: Config,
        eventName: string,
    ): Promise<boolean | void> {
        const smsConfig = config.channels.some(
            (c) => c.type === NOTIFICATION_CHANNELS.SMS,
        );
        const emailConfig = config.channels.some(
            (c) => c.type === NOTIFICATION_CHANNELS.EMAIL,
        );
        const webhookConfig = config.channels.some(
            (c) => c.type === NOTIFICATION_CHANNELS.WEBHOOK,
        );

        await this.queueRepository.consume(
            aggregateId,
            config,
            async (event: DomainEvent) => {
                if (
                    event.aggregateId !== aggregateId ||
                    event.eventName !== eventName
                )
                    return;

                if (smsConfig)
                    await this.sendSMS(notification, aggregateId, config);
                notification.markAsProcessed();
                if (emailConfig)
                    await this.sendEmail(
                        notification,
                        aggregateId,
                        config,
                        eventName,
                    );
                notification.markAsProcessed();
                if (webhookConfig) await this.sendWebhook(notification, config);
                notification.markAsProcessed();
            },
        );

        if (!notification.isProcessed) {
            await new Promise((resolve) => setTimeout(resolve, 5000));
        }
    }

    protected async sendSMS(
        notification: Notification,
        aggregateId: string,
        config: Config,
    ): Promise<void> {
        await this.notificationRepository.sendSMS(
            aggregateId,
            config,
            notification.content || '',
        );
    }

    protected async sendEmail(
        notification: Notification,
        aggregateId: string,
        config: Config,
        eventName: string,
    ): Promise<void> {
        await this.notificationRepository.sendEmail(
            aggregateId,
            config,
            eventName.split(/(?=[A-Z])/).join(' '),
            notification.template || '',
        );
    }

    protected async sendWebhook(
        notification: Notification,
        config: Config,
    ): Promise<void> {
        const endpoints = config.channels.find(
            (c) => c.type === NOTIFICATION_CHANNELS.WEBHOOK,
        )?.webhooks?.endpoints;
        await Promise.all(
            endpoints?.map((endpoint) =>
                this.notificationRepository.sendWebhook(
                    endpoint,
                    notification.content || '',
                ),
            ) || [],
        );
    }

    protected finalize(aggregate: T, notification: Notification): void {}
}
