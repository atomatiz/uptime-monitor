import {
    Injectable,
    NestInterceptor,
    ExecutionContext,
    CallHandler,
} from '@nestjs/common';
import { Observable } from 'rxjs';
import { map } from 'rxjs/operators';
import { Response } from '@common/interfaces/interceptor.interface';

export class TransformInterceptor<T>
    implements NestInterceptor<T, Response<T>>
{
    intercept(
        context: ExecutionContext,
        next: CallHandler,
    ): Observable<Response<T>> {
        return next.handle().pipe(
            map((data) => {
                return {
                    statusCode:
                        data.code ||
                        context.switchToHttp().getResponse().statusCode ||
                        '',
                    message: data.message || data.msg || '',
                    data: data || data.data || '',
                };
            }),
        );
    }
}
