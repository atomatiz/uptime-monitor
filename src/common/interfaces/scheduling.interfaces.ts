export interface SchedulingConfig {
    enabled: boolean;
    taskName: string;
    intervalExpression: string;
    timeZone?: string;
}

export interface ITaskConfig {
    [key: string]: SchedulingConfig;
}
