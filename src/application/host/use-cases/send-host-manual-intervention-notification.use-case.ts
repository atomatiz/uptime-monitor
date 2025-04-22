import { Inject } from '@nestjs/common';
import { CommandBus } from '@nestjs/cqrs';
import { Config } from '@common/interfaces';
import { Notification } from '@domain/notification';
import { NotificationContentFactory } from '@application/notification/factories/notification-content.factory';
import { hostManualInterventionTemplate } from '@resources/templates';
import { getHostManualInterventionMessage } from '@resources/localization/message-content';
import { NOTIFICATION_ID_SUFFIXES } from '@common/domains/notification';
import { QueueRepository } from '@application/notification/repositories/queue.repository';
import { DOMAINS, ID_PREFIXES } from '@common/constants';
import { Host } from '@domain/host';
import { BaseNotificationUseCase } from '@application/notification/bases/notification-use-case.base';
import { Optional } from '@common/types';

export class SendHostManualInterventionNotificationUseCase extends BaseNotificationUseCase<Host> {
    protected readonly domainType = DOMAINS.HOST;

    constructor(
        @Inject('QUEUE_REPOSITORY') queueRepository: QueueRepository,
        commandBus: CommandBus,
    ) {
        super(queueRepository, commandBus);
    }

    protected createNotification(
        host: Host,
        config: Config,
    ): Optional<Notification> {
        const notiContentType = NotificationContentFactory.determineOutput(
            config.channels,
        );
        const payload = {
            websiteUrl: config.websiteUrl,
            instanceId: host.instanceId,
            maxRestartAttempts: host.maxRestartAttempts,
            updatedAt: host.updatedAt,
        };
        return Notification.create(
            host.id,
            notiContentType.plainText
                ? getHostManualInterventionMessage(payload)
                : undefined,
            notiContentType.html
                ? hostManualInterventionTemplate(payload)
                : undefined,
            {},
            `${host.id}-${ID_PREFIXES.WEBSITE + config.websiteId}-${NOTIFICATION_ID_SUFFIXES.HOST_MANUAL_INTERVENTION}-${Date.now()}`,
        );
    }
}
