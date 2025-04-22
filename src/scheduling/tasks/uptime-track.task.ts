import { errorMessage } from '@common/utils/error-message.utils';
import { Injectable } from '@nestjs/common';
import { schedulingTaskConfig as config } from '@common/configs/scheduling.config';
import {
    ITaskConfig,
    SchedulingConfig,
} from '@common/interfaces/scheduling.interfaces';
import { generateWebsiteConfigs } from '@common/configs/system.config';
import { ConfigurationService } from '@core/configuration.service';
import { SchedulingHelper } from '@scheduling/repositories/scheduling.helper';
import { SchedulingRepository } from '@scheduling/repositories/scheduling.repository';
import { Config } from '@common/interfaces';
import { CommandBus } from '@nestjs/cqrs';
import { TrackWebsiteCommand } from '@domain/website/commands/track-website.command';

@Injectable()
export class UptimeTrackingTask extends SchedulingRepository {
    private readonly taskConfig: ITaskConfig;
    private readonly configs: Config[];

    constructor(
        private readonly commandBus: CommandBus,
        protected readonly schedulingHelper: SchedulingHelper,
        private readonly configService: ConfigurationService,
    ) {
        super(schedulingHelper);
        this.taskConfig = config();
        this.configs = generateWebsiteConfigs(this.configService);
    }

    protected getConfig(): SchedulingConfig {
        return {
            enabled: this.taskConfig.uptime_track.enabled,
            taskName: this.taskConfig.uptime_track.taskName,
            intervalExpression: this.taskConfig.uptime_track.intervalExpression,
            timeZone: this.taskConfig.uptime_track.timeZone,
        };
    }

    public async main(): Promise<void> {
        this.logger.log('Starting uptime tracking task');
        if (this.configs.length === 0) {
            this.logger.log(`No website configurations found`);
            return;
        }
        this.configs.forEach(async (config) => {
            await this.commandBus
                .execute(new TrackWebsiteCommand(config.websiteId))
                .catch((error: unknown) => {
                    this.logger.error(
                        errorMessage(
                            `Failed to track website ${config.websiteUrl}`,
                            error,
                        ),
                    );
                });
        });
    }
}
