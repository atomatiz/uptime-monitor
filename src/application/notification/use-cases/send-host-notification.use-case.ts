import { Injectable } from '@nestjs/common';
import { Config, UseCase } from '@common/interfaces';
import { generateWebsiteConfigs } from '@common/configs';
import { ConfigurationService } from '@core/configuration.service';
import { ID_PREFIXES } from '@common/constants';
import { HOST_EVENT_NAMES } from '@common/domains/host';
import { SendHostRestartedNotificationUseCase } from '@application/host/use-cases/send-host-restarted-notification.use-case';
import { SendHostManualInterventionNotificationUseCase } from '@application/host/use-cases/send-host-manual-intervention-notification.use-case';

@Injectable()
export class SendHostNotificationUseCase implements UseCase<string, void> {
    private readonly configs: Config[];
    constructor(
        private readonly sendHostRestartedNotificationUseCase: SendHostRestartedNotificationUseCase,
        private readonly sendHostManualInterventionNotificationUseCase: SendHostManualInterventionNotificationUseCase,
        private readonly configService: ConfigurationService,
    ) {
        this.configs = generateWebsiteConfigs(this.configService);
    }

    async execute(aggregateId: string, eventName: string): Promise<void> {
        const hostConfig = this.configs.find(
            (config) =>
                config.websiteId === aggregateId.replace(ID_PREFIXES.HOST, ''),
        ) as Config;
        switch (eventName) {
            case HOST_EVENT_NAMES.HOST_RESTARTED_EVENT:
                await this.sendHostRestartedNotificationUseCase.execute(
                    aggregateId,
                    hostConfig,
                    eventName,
                );
                break;

            case HOST_EVENT_NAMES.HOST_MANUAL_INTERVENTION_EVENT:
                await this.sendHostManualInterventionNotificationUseCase.execute(
                    aggregateId,
                    hostConfig,
                    eventName,
                );
                break;

            default:
                throw new Error(`Unsupported event for ID: ${aggregateId}`);
        }
    }
}
