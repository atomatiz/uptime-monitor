import { Inject } from '@nestjs/common';
import { CommandBus } from '@nestjs/cqrs';
import { Config } from '@common/interfaces';
import { Notification } from '@domain/notification';
import { Website } from '@domain/website';
import { NotificationContentFactory } from '@application/notification/factories/notification-content.factory';
import { websiteUpTemplate } from '@resources/templates';
import { getWebsiteUpMessage } from '@resources/localization/message-content';
import { NOTIFICATION_ID_SUFFIXES } from '@common/domains/notification';
import { QueueRepository } from '@application/notification/repositories/queue.repository';
import { DOMAINS } from '@common/constants';
import { BaseNotificationUseCase } from '@application/notification/bases/notification-use-case.base';
import { Optional } from '@common/types';

export class SendWebsiteUpNotificationUseCase extends BaseNotificationUseCase<Website> {
    protected readonly domainType = DOMAINS.WEBSITE;

    constructor(
        @Inject('QUEUE_REPOSITORY') queueRepository: QueueRepository,
        commandBus: CommandBus,
    ) {
        super(queueRepository, commandBus);
    }

    protected createNotification(
        website: Website,
        config: Config,
    ): Optional<Notification> {
        const notiContentType = NotificationContentFactory.determineOutput(
            config.channels,
        );
        const payload = {
            url: website.url,
            totalDowntime: website.totalDowntime,
        };
        return Notification.create(
            website.id,
            notiContentType.plainText
                ? getWebsiteUpMessage(payload)
                : undefined,
            notiContentType.html ? websiteUpTemplate(payload) : undefined,
            {},
            `${website.id}-${website.host.id}-${NOTIFICATION_ID_SUFFIXES.WEBSITE_UP}-${Date.now()}`,
        );
    }
}
