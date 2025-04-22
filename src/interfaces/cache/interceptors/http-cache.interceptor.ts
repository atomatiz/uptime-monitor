import { httpCacheInterceptorExcludePaths } from '@common/configs';
import { HTTP_METHODS } from '@common/constants';
import { HttpCacheInterceptorOptions } from '@common/interfaces';
import { errorMessage } from '@common/utils';
import { ConfigurationService } from '@core/configuration.service';
import { LoggingService } from '@core/logging.service';
import { CACHE_MANAGER } from '@nestjs/cache-manager';
import {
    Injectable,
    NestInterceptor,
    Inject,
    ExecutionContext,
    CallHandler,
} from '@nestjs/common';
import { Observable, of, tap } from 'rxjs';
import { Cache } from 'cache-manager';

@Injectable()
export class HttpCacheInterceptor implements NestInterceptor {
    private readonly logger: LoggingService = new LoggingService(
        HttpCacheInterceptor.name,
    );
    private readonly options: HttpCacheInterceptorOptions;

    constructor(
        @Inject(CACHE_MANAGER) private cacheManager: Cache,
        private readonly config: ConfigurationService,
    ) {
        this.options = {
            excludePaths: httpCacheInterceptorExcludePaths,
            ttl: this.config.get('HTTP_CACHE_TTL'),
            max: this.config.get('HTTP_CACHE_MAX'),
        };
    }

    async intercept(
        context: ExecutionContext,
        next: CallHandler,
    ): Promise<Observable<any>> {
        const request = context.switchToHttp().getRequest<Request>();
        const requestMethod = request.method;

        if (requestMethod !== HTTP_METHODS.GET) {
            return next.handle();
        }

        const requestUrl = request.url;
        for (const path of this.options.excludePaths!) {
            if (requestUrl.includes(path)) {
                return next.handle();
            }
        }

        const cacheKey = this.generateCacheKey(request);

        try {
            const cachedResponse: unknown =
                await this.cacheManager?.get(cacheKey);
            if (cachedResponse) {
                return of(cachedResponse);
            }
        } catch (error: unknown) {
            this.logger.error(errorMessage('Cache get error', error));
        }

        return next.handle().pipe(
            tap((response) => {
                try {
                    if (
                        !this.options.max ||
                        this.estimateResponseSize(response) <=
                            (this.options.max ?? Infinity)
                    ) {
                        void this.cacheManager?.set(
                            cacheKey,
                            response,
                            this.options.ttl,
                        );
                    }
                } catch (error: unknown) {
                    this.logger.error(errorMessage('Cache set error', error));
                }
            }),
        );
    }

    private generateCacheKey(request: Request): string {
        const url = request.url;
        return url;
    }

    private estimateResponseSize(response: any): number {
        try {
            const jsonString = JSON.stringify(response);
            return jsonString.length;
        } catch (error: unknown) {
            this.logger.error(
                errorMessage('Estimate response size error', error),
            );
            return Infinity;
        }
    }
}
