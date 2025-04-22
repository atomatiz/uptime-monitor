import { Injectable } from '@nestjs/common';
import { Config } from '@common/interfaces';
import aggregateStore from '@domain/aggregate-store';
import { Website } from '@domain/website';
import { WEBSITE_EVENT_NAMES } from '@common/domains/website';
import { generateWebsiteConfigs } from '@common/configs';
import { ConfigurationService } from '@core/configuration.service';
import { ID_PREFIXES } from '@common/constants';
import { Processor } from '@common/interfaces/processor.inerface';
import { Notification } from '@domain/notification';
import { ProcessWebsiteDownNotificationProcessor } from '@application/website/processors/process-website-down-notification.processor';
import { ProcessWebsiteUpNotificationProcessor } from '@application/website/processors/process-website-up-notification.processor';

@Injectable()
export class ProcessWebsiteQueueProcessor implements Processor<string, void> {
    private readonly configs: Config[];
    constructor(
        private readonly processWebsiteDownNotificationProcessor: ProcessWebsiteDownNotificationProcessor,
        private readonly processWebsiteUpNotificationProcessor: ProcessWebsiteUpNotificationProcessor,
        private readonly configService: ConfigurationService,
    ) {
        this.configs = generateWebsiteConfigs(this.configService);
    }

    async execute(aggregateId: string, eventName: string): Promise<void> {
        const notification = aggregateStore.get<Notification>(aggregateId);
        if (!notification || !notification.correlationId) {
            throw new Error(`No notification found with ID: ${aggregateId}`);
        }
        if (!notification.isPending) return;
        const website = aggregateStore.get<Website>(
            notification?.correlationId,
        );
        const websiteConfig = this.configs.find(
            (config) =>
                config.websiteId ===
                website?.id.replace(ID_PREFIXES.WEBSITE, ''),
        ) as Config;
        switch (eventName) {
            case WEBSITE_EVENT_NAMES.WEBSITE_DOWN_EVENT:
                await this.processWebsiteDownNotificationProcessor.execute(
                    aggregateId,
                    websiteConfig,
                    eventName,
                );
                break;
            case WEBSITE_EVENT_NAMES.WEBSITE_UP_EVENT:
                await this.processWebsiteUpNotificationProcessor.execute(
                    aggregateId,
                    websiteConfig,
                    eventName,
                );
                break;

            default:
                throw new Error(`Unsupported event for ID: ${aggregateId}`);
        }
    }
}
