import {
    ArgumentsHost,
    ExceptionFilter,
    HttpException,
    HttpStatus,
} from '@nestjs/common';
import { Request, Response } from 'express';
import { SentryExceptionCaptured } from '@sentry/nestjs';

export class AllExceptionsFilter implements ExceptionFilter {
    @SentryExceptionCaptured()
    catch(exception: Error, host: ArgumentsHost): void {
        const ctx = host.switchToHttp();
        const response = ctx.getResponse<Response>();
        const request = ctx.getRequest<Request>();

        const statusCode: number =
            exception instanceof HttpException
                ? exception.getStatus()
                : HttpStatus.BAD_REQUEST;

        const message =
            exception instanceof HttpException
                ? exception.getResponse() || exception.message
                : exception.message || 'Internal server error';

        response.status(statusCode).send({
            ...(typeof message === 'string' ? { message } : message),
            statusCode,
            timestamp: new Date().toISOString(),
            success: false,
            path: request.url,
            method: request.method,
            errorName: exception?.name,
        });
    }
}
