import { Injectable } from '@nestjs/common';
import { Config } from '@common/interfaces';
import aggregateStore from '@domain/aggregate-store';
import { generateWebsiteConfigs } from '@common/configs';
import { ConfigurationService } from '@core/configuration.service';
import { ID_PREFIXES } from '@common/constants';
import { Processor } from '@common/interfaces/processor.inerface';
import { Notification } from '@domain/notification';
import { Host } from '@domain/host';
import { HOST_EVENT_NAMES } from '@common/domains/host';
import { ProcessHostRestartedNotificationProcessor } from '@application/host/processors/process-host-restarted-notification.processor';
import { ProcessHostManualInterventionNotificationProcessor } from '@application/host/processors/process-host-manual-intervention.processor';

@Injectable()
export class ProcessHostQueueProcessor implements Processor<string, void> {
    private readonly configs: Config[];
    constructor(
        private readonly processHostRestartedNotificationProcessor: ProcessHostRestartedNotificationProcessor,
        private readonly processHostManualInterventionNotificationProcessor: ProcessHostManualInterventionNotificationProcessor,
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
        const host = aggregateStore.get<Host>(notification?.correlationId);
        const websiteConfig = this.configs.find(
            (config) =>
                config.websiteId === host?.id.replace(ID_PREFIXES.HOST, ''),
        ) as Config;
        switch (eventName) {
            case HOST_EVENT_NAMES.HOST_RESTARTED_EVENT:
                await this.processHostRestartedNotificationProcessor.execute(
                    aggregateId,
                    websiteConfig,
                    eventName,
                );
                break;
            case HOST_EVENT_NAMES.HOST_MANUAL_INTERVENTION_EVENT:
                await this.processHostManualInterventionNotificationProcessor.execute(
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
