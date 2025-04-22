import { LoggingService } from '@core/logging.service';
import { CronJob } from 'cron';
import { errorMessage } from '@common/utils/error-message.utils';
import { SchedulingConfig } from '@common/interfaces/scheduling.interfaces';

export class SchedulingHelper {
    private readonly logger = new LoggingService(SchedulingHelper.name);

    public initializeTask<T>(
        fn: () => Promise<T>,
        taskConfig: SchedulingConfig,
    ): CronJob | void {
        const job = new CronJob(
            taskConfig.intervalExpression,
            async () => {
                try {
                    await fn();
                } catch (error: unknown) {
                    this.logger.error(
                        errorMessage(
                            `Error in cron job ${taskConfig.taskName}`,
                            error,
                        ),
                    );
                }
            },
            null,
            taskConfig.enabled,
            taskConfig.timeZone,
        );

        if (!taskConfig.enabled) {
            this.logger.log(`Cron job disabled: ${taskConfig.taskName}`);
            return;
        }

        job.start();
        return job;
    }

    public start<T>(
        taskConfig: SchedulingConfig,
        mainFunc: () => Promise<T>,
    ): void {
        try {
            if (!taskConfig.enabled) {
                return;
            }
            this.initializeTask(mainFunc, taskConfig);
        } catch (error) {
            this.logger.error(
                errorMessage(
                    `Failed to initialize cron job ${taskConfig.taskName}`,
                    error,
                ),
            );
        }
    }
}
