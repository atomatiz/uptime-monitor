import { ITaskConfig } from '@common/interfaces/scheduling.interfaces';

export function schedulingTaskConfig(): ITaskConfig {
    const timezone = process.env.TIMEZONE || 'UTC';

    return {
        uptime_track: {
            enabled: true,
            taskName: 'UptimeTrackingTask',
            intervalExpression: '*/1 * * * *',
            timeZone: timezone,
        },
    };
}
