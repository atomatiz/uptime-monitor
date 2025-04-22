import { CommandHandler, ICommandHandler } from '@nestjs/cqrs';
import { TrackWebsiteCommand } from '@domain/website/commands/track-website.command';
import { TrackWebsiteUseCase } from '../use-cases/track-website.use-case';
import { Config } from '@common/interfaces';
import { generateWebsiteConfigs } from '@common/configs';
import { ConfigurationService } from '@core/configuration.service';
import { ID_PREFIXES } from '@common/constants';
import { Host } from '@domain/host';
import aggregateStore from '@domain/aggregate-store';
import { Website } from '@domain/website';
import { LoggingService } from '@core/logging.service';
import { errorMessage } from '@common/utils';

@CommandHandler(TrackWebsiteCommand)
export class TrackWebsiteCommandHandler
    implements ICommandHandler<TrackWebsiteCommand>
{
    private readonly logger = new LoggingService(
        TrackWebsiteCommandHandler.name,
    );
    private readonly configs: Config[];

    constructor(
        private readonly trackWebsiteUseCase: TrackWebsiteUseCase,
        private readonly configService: ConfigurationService,
    ) {
        this.configs = generateWebsiteConfigs(this.configService);
    }

    async execute(command: TrackWebsiteCommand): Promise<void> {
        const { aggregateId } = command;
        if (!aggregateStore.get(ID_PREFIXES + aggregateId)) {
            try {
                const websiteConfig = this.configs.find(
                    (config) => config.websiteId === aggregateId,
                ) as Config;
                const {
                    websiteId,
                    websiteName,
                    websiteUrl,
                    instanceId,
                    host,
                    apiRetryAttempts,
                    websiteDowntimeThreshold,
                    hostStartupThreshold,
                    maxRestartAttempts,
                } = websiteConfig;

                const _host = Host.create(
                    host.hostType,
                    instanceId,
                    hostStartupThreshold,
                    maxRestartAttempts,
                    ID_PREFIXES.HOST + websiteId,
                );

                if (!_host) {
                    throw new Error(`Error creating host: ${instanceId}`);
                }

                if (!aggregateStore.get(_host.id)) {
                    aggregateStore.set(_host);
                }

                const website = Website.create(
                    websiteUrl,
                    websiteName,
                    _host,
                    apiRetryAttempts,
                    websiteDowntimeThreshold,
                    ID_PREFIXES.WEBSITE + websiteId,
                );

                if (!website) {
                    throw new Error(`Error creating website: ${websiteUrl}`);
                }

                if (!aggregateStore.get(website.id)) {
                    aggregateStore.set(website);
                }
            } catch (error: unknown) {
                this.logger.error(
                    errorMessage(`Error initializing websites`, error),
                );
            }
        }
        await this.trackWebsiteUseCase.execute(
            ID_PREFIXES.WEBSITE + aggregateId,
        );
    }
}
