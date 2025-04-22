import { HTTP_RATE_LIMITER } from '@common/constants';
import { CoreModule } from '@core/core.module';
import {
    MiddlewareConsumer,
    Module,
    NestModule,
    RequestMethod,
} from '@nestjs/common';
import { APP_GUARD, APP_INTERCEPTOR } from '@nestjs/core';
import { TerminusModule } from '@nestjs/terminus';
import { ThrottlerModule, ThrottlerGuard } from '@nestjs/throttler';
import { CacheManagerModule } from './cache/cache.module';
import { RolesGuard } from './guards';
import { HealthController } from './health.controller';
import { ExcludeNullInterceptor, TimeoutInterceptor } from './interceptors';
import {
    LoggingMiddleware,
    ExceptionMiddleware,
    AuthMiddleware,
} from './middlewares';

@Module({
    imports: [
        ThrottlerModule.forRoot({
            throttlers: [
                {
                    ttl: HTTP_RATE_LIMITER.ttl,
                    limit: HTTP_RATE_LIMITER.limit,
                },
            ],
        }),
        TerminusModule,
        CoreModule,
        CacheManagerModule,
    ],
    controllers: [HealthController],
    providers: [
        {
            provide: APP_GUARD,
            useClass: RolesGuard,
        },
        {
            provide: APP_GUARD,
            useClass: ThrottlerGuard,
        },
        {
            provide: APP_INTERCEPTOR,
            useClass: ExcludeNullInterceptor,
        },
        {
            provide: APP_INTERCEPTOR,
            useClass: TimeoutInterceptor,
        },
    ],
})
export class InterfaceModule implements NestModule {
    configure(consumer: MiddlewareConsumer): void {
        consumer.apply(LoggingMiddleware).forRoutes('{*splat}');
        consumer.apply(ExceptionMiddleware).forRoutes('{*splat}');
        consumer
            .apply(AuthMiddleware)
            .exclude({ path: 'health', method: RequestMethod.GET })
            .forRoutes({ path: '{*splat}', method: RequestMethod.ALL });
    }
}
