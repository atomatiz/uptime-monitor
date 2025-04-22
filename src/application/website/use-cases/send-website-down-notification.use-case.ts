import { Inject } from '@nestjs/common';
import { CommandBus } from '@nestjs/cqrs';
import { Config } from '@common/interfaces';
import { Notification } from '@domain/notification';
import { Website } from '@domain/website';
import { NotificationContentFactory } from '@application/notification/factories/notification-content.factory';
import { websiteDownTemplate } from '@resources/templates';
import { getWebsiteDownMessage } from '@resources/localization/message-content';
import { NOTIFICATION_ID_SUFFIXES } from '@common/domains/notification';
import { QueueRepository } from '@application/notification/repositories/queue.repository';
import { DOMAINS } from '@common/constants';
import { BaseNotificationUseCase } from '@application/notification/bases/notification-use-case.base';
import { Optional } from '@common/types';

export class SendWebsiteDownNotificationUseCase extends BaseNotificationUseCase<Website> {
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
            url: website?.url,
            lastDownTime: website.lastDowntime!,
        };
        return Notification.create(
            website.id,
            notiContentType.plainText
                ? getWebsiteDownMessage(payload)
                : undefined,
            notiContentType.html ? websiteDownTemplate(payload) : undefined,
            {},
            `${website.id}-${website.host.id}-${NOTIFICATION_ID_SUFFIXES.WEBSITE_DOWN}-${Date.now()}`,
        );
    }
}
