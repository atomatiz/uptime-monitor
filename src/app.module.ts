import { Module } from '@nestjs/common';
import { DevtoolsModule } from '@nestjs/devtools-integration';
import { InterfaceModule } from '@interfaces/interface.module';
import { SentryModule } from '@sentry/nestjs/setup';
import { ENVIRONMENTS } from '@common/constants/global.constants';
import { SchedulingModule } from '@scheduling/scheduling.module';

@Module({
    imports: [
        DevtoolsModule.register({
            http: process.env.NODE_ENV !== ENVIRONMENTS.Production,
        }),
        SentryModule.forRoot(),
        SchedulingModule,
        InterfaceModule,
    ],
    providers: [],
})
export class AppModule {}
