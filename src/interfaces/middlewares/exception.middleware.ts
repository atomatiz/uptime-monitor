import { HTTP_STATUS_CODES } from '@common/constants/http.constants';
import { LoggingService } from '@core/logging.service';
import { NestMiddleware } from '@nestjs/common';
import { Request, Response, NextFunction } from 'express';

export class ExceptionMiddleware implements NestMiddleware {
    private readonly logger = new LoggingService(ExceptionMiddleware.name);

    use(req: Request, res: Response, next: NextFunction) {
        const realIp =
            req.headers['x-real-ip'] ||
            req.headers['x-forwarded-for'] ||
            req.connection.remoteAddress;
        res.on('finish', () => {
            const statusCode = res.statusCode;
            if (
                statusCode === HTTP_STATUS_CODES.UNAUTHORIZED ||
                statusCode === HTTP_STATUS_CODES.BAD_REQUEST ||
                statusCode === HTTP_STATUS_CODES.METHOD_NOT_ALLOWED
            ) {
                this.logger.warn(
                    `[${req.method}] - ${realIp} - ${req.url} - ${req.headers['user-agent']} - ${statusCode}`,
                );
            }
        });

        next();
    }
}
