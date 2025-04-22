import { Module } from '@nestjs/common';
import { CoreModule } from '@core/core.module';
import { SchedulingHelper } from '@scheduling/repositories/scheduling.helper';
import { UptimeTrackingTask } from '@scheduling/tasks/uptime-track.task';
import { SchedulingService } from '@scheduling/scheduling.service';
import { ApplicationModule } from '@application/application.module';

@Module({
    imports: [CoreModule, ApplicationModule],
    providers: [SchedulingHelper, SchedulingService, UptimeTrackingTask],
    exports: [SchedulingService, SchedulingHelper],
})
export class SchedulingModule {}
