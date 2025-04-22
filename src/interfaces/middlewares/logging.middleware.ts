import { Request, Response, NextFunction } from 'express';
import { NestMiddleware } from '@nestjs/common';
import { LoggingService } from '@core/logging.service';
import { HTTP_STATUS_CODES } from '@common/constants/http.constants';

export class LoggingMiddleware implements NestMiddleware {
    private readonly logger = new LoggingService(LoggingMiddleware.name);

    use(request: Request, response: Response, next: NextFunction): void {
        const { method, originalUrl, params, query, body } = request;
        const userAgent = request.get('user-agent') || '';
        const now = Date.now();

        let clientIp;
        const realIp =
            request.headers['x-real-ip'] ||
            request.headers['x-forwarded-for'] ||
            request.connection.remoteAddress;
        if (userAgent.includes('kube-probe')) {
            clientIp = process.env.NODE_IP || request.ip;
        } else if (realIp) {
            clientIp = Array.isArray(realIp)
                ? realIp[0]
                : realIp.split(',')[0].trim();
        } else {
            clientIp = request.ip;
        }

        let message = `Incoming request - ${clientIp} - ${method} - ${originalUrl} - ${response.statusCode} - ${userAgent} - params: ${JSON.stringify(params)} - queries: ${JSON.stringify(query)} - body: ${JSON.stringify(body)}`;

        response.on('finish', () => {
            const delay = `+${Date.now() - now}ms`;
            message = `${message} - ${delay}`;
            const statusCode = response.statusCode;
            statusCode >= HTTP_STATUS_CODES.BAD_REQUEST
                ? this.logger.error(message)
                : this.logger.log(message);
        });

        next();
    }
}
