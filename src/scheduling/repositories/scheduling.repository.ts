import { IScheduling } from '@scheduling/interfaces/scheduling.interface';
import { SchedulingHelper } from '@scheduling/repositories/scheduling.helper';
import { LoggingService } from '@core/logging.service';
import { SchedulingConfig } from '@common/interfaces/scheduling.interfaces';

export abstract class SchedulingRepository<T = void> implements IScheduling<T> {
    protected readonly logger = new LoggingService(this.constructor.name);
    constructor(protected readonly schedulingHelper: SchedulingHelper) {}
    protected abstract getConfig(): SchedulingConfig;
    public abstract main(): Promise<T>;

    public start(): void {
        const config = this.getConfig();
        this.schedulingHelper.start<T>(
            config,
            this.main.bind(this) as () => Promise<T>,
        );
    }
}
