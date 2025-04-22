import { utilities } from '@common/configs/logging.config';
import { Optional } from '@nestjs/common';
import * as winston from 'winston';
import { LoggingRepository } from './repositories/logging.repository';

export class LoggingService extends LoggingRepository {
    private readonly logger: winston.Logger;
    private readonly ctx: string;

    constructor(@Optional() private readonly context?: string) {
        super();
        this.ctx = this.context ?? 'Uptime Monitor';

        this.logger = winston.createLogger({
            level: 'info',
            format: winston.format.combine(
                winston.format.timestamp({
                    format: () => {
                        return new Date()
                            .toLocaleString('en-US', {
                                timeZone: process.env.TIMEZONE ?? 'UTC',
                                year: 'numeric',
                                month: '2-digit',
                                day: '2-digit',
                                hour: '2-digit',
                                minute: '2-digit',
                                second: '2-digit',
                                hour12: false,
                                formatMatcher: 'basic',
                            })
                            .replace(/(\d+)\/(\d+)\/(\d+),\s/, '$3-$1-$2 ');
                    },
                }),
                winston.format.ms(),
                utilities.format.nestLike(),
            ),
            transports: [new winston.transports.Console({})],
            defaultMeta: { context: this.ctx },
        });
    }

    log(message: any, meta?: any[]): void {
        this.logger.info(message, meta);
    }

    info(message: any, meta?: any[]): void {
        this.logger.info(message, meta);
    }

    error(message: any, meta?: any[]): void {
        this.logger.error(message, meta);
    }

    warn(message: any, meta?: any[]): void {
        this.logger.warn(message, meta);
    }

    debug(message: any, meta?: any[]): void {
        this.logger.debug(message, meta);
    }
}
