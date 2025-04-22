import { Injectable, OnModuleInit } from '@nestjs/common';
import { ModuleRef } from '@nestjs/core';
import { LoggingService } from '@core/logging.service';
import { errorMessage } from '@common/utils/error-message.utils';
import { IScheduling } from '@scheduling/interfaces/scheduling.interface';
import { UptimeTrackingTask } from '@scheduling/tasks/uptime-track.task';
import { ConfigurationService } from '@core/configuration.service';

@Injectable()
export class SchedulingService implements OnModuleInit {
    private readonly logger = new LoggingService(SchedulingService.name);

    /**
     * Map of tasks to be registered
     * @description
     * Declares the tasks to be registered here
     */
    private readonly taskMap = new Map<
        string,
        new (...args: any[]) => IScheduling<unknown>
    >([[UptimeTrackingTask.name, UptimeTrackingTask]]); // ... add more tasks here

    private registeredTasks = new Map<string, IScheduling<unknown>>();

    constructor(
        private readonly moduleRef: ModuleRef,
        private readonly config: ConfigurationService,
    ) {}

    public async onModuleInit(): Promise<void> {
        if (!this.config.get('ENABLE_SCHEDULING')) {
            this.logger.log('Scheduling is disabled');
            return;
        }

        try {
            await this.registerTasks(this.taskMap);
            await this.invoke();
        } catch (error: unknown) {
            this.logger.error(
                errorMessage('Failed to register scheduled tasks', error),
            );
        }
    }

    public async registerTasks<T>(
        taskMap: Map<string, new (...args: any[]) => IScheduling<T>>,
    ): Promise<void> {
        const registrationPromises = Array.from(taskMap.entries()).map(
            async ([taskName, taskType]) => {
                try {
                    const task = await this.moduleRef.resolve(taskType);
                    this.registeredTasks.set(taskName, task);
                } catch (error: unknown) {
                    this.logger.error(
                        errorMessage(
                            `Failed to register task ${taskName}`,
                            error,
                        ),
                    );
                }
            },
        );

        await Promise.all(registrationPromises);
    }

    public async invoke(): Promise<void> {
        const taskPromises = Array.from(this.registeredTasks.entries()).map(
            async ([taskName, task]) => {
                try {
                    await Promise.resolve(task.start());
                } catch (error: unknown) {
                    this.logger.error(
                        errorMessage(`Failed to start task ${taskName}`, error),
                    );
                }
            },
        );

        await Promise.all(taskPromises);

        this.logger.log(
            `All scheduled tasks started: ${Array.from(
                this.registeredTasks.values(),
            )
                .map((task) => task.constructor.name)
                .join(', ')}`,
        );
    }
}
