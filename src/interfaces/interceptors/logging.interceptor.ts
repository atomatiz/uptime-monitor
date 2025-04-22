import { LoggingService } from '@core/logging.service';
import {
    CallHandler,
    ExecutionContext,
    HttpException,
    HttpStatus,
    NestInterceptor,
} from '@nestjs/common';
import { Request } from 'express';
import { Observable } from 'rxjs';
import { tap } from 'rxjs/operators';
import { Response as ResponseInterface } from '@common/interfaces/interceptor.interface';

export class LoggingInterceptor implements NestInterceptor {
    private readonly logger: LoggingService = new LoggingService(
        LoggingInterceptor.name,
    );
    private startTime = 0;

    constructor() {
        this.startTime = Date.now();
    }

    public intercept(
        context: ExecutionContext,
        call$: CallHandler,
    ): Observable<unknown> {
        return call$.handle().pipe(
            tap({
                next: (val: ResponseInterface<unknown>): void => {
                    this.logNext(val, context);
                },
                error: (err: Error): void => {
                    this.logError(err, context);
                },
            }),
        );
    }

    private logNext(
        data: ResponseInterface<unknown>,
        context: ExecutionContext,
    ): void {
        const req: Request = context.switchToHttp().getRequest<Request>();
        const realIp =
            req.headers['x-real-ip'] ||
            req.headers['x-forwarded-for'] ||
            req.connection.remoteAddress;
        const { method, originalUrl } = req;
        const message = `Outgoing response - ${realIp} - ${method} - ${originalUrl} - ${data.statusCode} - ${JSON.stringify(data.data)}`;
        const delay = `+${Date.now() - this.startTime}ms`;
        const log = message + ' - ' + delay;
        this.logger.log(log);
    }

    private logError(error: Error, context: ExecutionContext): void {
        const req: Request = context.switchToHttp().getRequest<Request>();
        const { method, originalUrl } = req;
        const realIp =
            req.headers['x-real-ip'] ||
            req.headers['x-forwarded-for'] ||
            req.connection.remoteAddress;
        if (error instanceof HttpException) {
            const statusCode: number = error.getStatus();
            const err = error.message ?? error.stack;
            const message = `Outgoing response - ${realIp} - ${method} - ${originalUrl} - ${statusCode} - ${err}`;
            const delay = `+${Date.now() - this.startTime}ms`;
            const log = message + ' - ' + delay;
            if (statusCode >= HttpStatus.INTERNAL_SERVER_ERROR) {
                this.logger.error(log);
            } else {
                this.logger.warn(log);
            }
        } else {
            const err = error.message ?? error.stack;
            const message = `Outgoing response - ${realIp} - ${method} - ${originalUrl} - ${err}`;
            const delay = `+${Date.now() - this.startTime}ms`;
            const log = message + ' - ' + delay;
            this.logger.error(log);
        }
    }
}
