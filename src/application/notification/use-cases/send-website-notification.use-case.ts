import { Injectable } from '@nestjs/common';
import { Config, UseCase } from '@common/interfaces';
import { WEBSITE_EVENT_NAMES } from '@common/domains/website';
import { SendWebsiteDownNotificationUseCase } from '@application/website/use-cases/send-website-down-notification.use-case';
import { generateWebsiteConfigs } from '@common/configs';
import { ConfigurationService } from '@core/configuration.service';
import { ID_PREFIXES } from '@common/constants';
import { SendWebsiteUpNotificationUseCase } from '@application/website/use-cases/send-website-up-notification.use-case';

@Injectable()
export class SendWebsiteNotificationUseCase implements UseCase<string, void> {
    private readonly configs: Config[];
    constructor(
        private readonly sendWebsiteDownNotificationUseCase: SendWebsiteDownNotificationUseCase,
        private readonly sendWebsiteUpNotificationUseCase: SendWebsiteUpNotificationUseCase,
        private readonly configService: ConfigurationService,
    ) {
        this.configs = generateWebsiteConfigs(this.configService);
    }

    async execute(aggregateId: string, eventName: string): Promise<void> {
        const websiteConfig = this.configs.find(
            (config) =>
                config.websiteId ===
                aggregateId.replace(ID_PREFIXES.WEBSITE, ''),
        ) as Config;
        switch (eventName) {
            case WEBSITE_EVENT_NAMES.WEBSITE_DOWN_EVENT:
                await this.sendWebsiteDownNotificationUseCase.execute(
                    aggregateId,
                    websiteConfig,
                    eventName,
                );
                break;
            case WEBSITE_EVENT_NAMES.WEBSITE_UP_EVENT:
                await this.sendWebsiteUpNotificationUseCase.execute(
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
