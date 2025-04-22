import { Module } from '@nestjs/common';
import { CoreModule } from '@core/core.module';
import { InfrastructureModule } from '@infrastructure/infrastructure.module';
import { CqrsModule } from '@nestjs/cqrs';
import { HostCommandHandlers } from './host/command-handlers';
import { HostEventHandlers } from './host/event-handlers';
import { HostProcessors } from './host/processors';
import { HostUseCases } from './host/use-cases';
import { NotificationCommandHandlers } from './notification/command-handlers';
import { NotificationProcessors } from './notification/processors';
import { NotificationUseCases } from './notification/use-cases';
import { WebsiteCommandHandlers } from './website/command-handlers';
import { WebsiteEventHandlers } from './website/event-handlers';
import { WebsiteProcessors } from './website/processors';
import { WebsiteUseCases } from './website/use-cases';

@Module({
    imports: [CoreModule, CqrsModule.forRoot(), InfrastructureModule],
    providers: [
        ...HostCommandHandlers,
        ...HostEventHandlers,
        ...HostProcessors,
        ...HostUseCases,
        ...NotificationCommandHandlers,
        ...NotificationProcessors,
        ...NotificationUseCases,
        ...WebsiteCommandHandlers,
        ...WebsiteEventHandlers,
        ...WebsiteProcessors,
        ...WebsiteUseCases,
    ],
    exports: [],
})
export class ApplicationModule {}
