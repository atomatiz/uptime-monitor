import { Module } from '@nestjs/common';
import { CacheModule } from '@nestjs/cache-manager';
import { ConfigurationService } from '@core/configuration.service';
import { CoreModule } from '@core/core.module';
import { HttpCacheInterceptor } from '@interfaces/cache/interceptors/http-cache.interceptor';
import { APP_INTERCEPTOR } from '@nestjs/core';

@Module({
    imports: [
        CoreModule,
        CacheModule.registerAsync({
            isGlobal: false,
            imports: [CoreModule],
            useFactory: (config: ConfigurationService) => ({
                ttl: config.get('HTTP_CACHE_TTL'),
            }),
            inject: [ConfigurationService],
        }),
    ],
    providers: [
        {
            provide: APP_INTERCEPTOR,
            useClass: HttpCacheInterceptor,
        },
    ],
    exports: [CacheModule],
})
export class CacheManagerModule {}
