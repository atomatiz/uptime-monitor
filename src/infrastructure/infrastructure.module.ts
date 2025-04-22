import { Module } from '@nestjs/common';
import { CoreModule } from '@core/core.module';
import { HostRepositoryImpl } from './host/repositories/host.repository.impl';
import { NotificationRepositoryImpl } from './notification/repositories/notification.repository.impl';
import { QueueRepositoryImpl } from './notification/repositories/queue.repository.impl';
import { WebsiteRepositoryImpl } from './website/repositories/website.repository.impl';
import { PersistenceModule } from './persistence/persistence.module';
import { DATABASE_TYPES } from '@common/constants/database.constants';
import { HttpClients } from './clients/http';
import { HostClients } from './clients/hosts';
import { NotificationClients } from './clients/notifications';
import { QueueClients } from './clients/queues';

@Module({
    imports: [
        CoreModule,
        PersistenceModule.register({
            types: [DATABASE_TYPES.PRISMA, DATABASE_TYPES.MONGOOSE],
            global: false,
        }),
    ],
    providers: [
        ...HttpClients,
        ...HostClients,
        ...NotificationClients,
        ...QueueClients,
        {
            provide: 'WEBSITE_REPOSITORY',
            useClass: WebsiteRepositoryImpl,
        },
        {
            provide: 'HOST_REPOSITORY',
            useClass: HostRepositoryImpl,
        },
        {
            provide: 'NOTIFICATION_REPOSITORY',
            useClass: NotificationRepositoryImpl,
        },
        {
            provide: 'QUEUE_REPOSITORY',
            useClass: QueueRepositoryImpl,
        },
    ],
    exports: [
        'WEBSITE_REPOSITORY',
        'HOST_REPOSITORY',
        'NOTIFICATION_REPOSITORY',
        'QUEUE_REPOSITORY',
    ],
})
export class InfrastructureModule {}
