import { Env } from '@common/configs/env.config';
import { ENVIRONMENTS } from '@common/constants/global.constants';
import { ENVIRONMENT, API_DOC } from '@common/types/global.types';
import { Injectable } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { ConfigurationRepository } from './repositories/configuration.repository';
import sanitizeCommand from '@common/utils/sanitize-command.util';

@Injectable()
export class ConfigurationService extends ConfigurationRepository<Env> {
    private readonly env: ENVIRONMENT;

    constructor(private readonly configService: ConfigService<Env, true>) {
        super();
        this.env = this.get('NODE_ENV') || ENVIRONMENTS.Development;
    }

    get<T extends keyof Env>(key: T): Env[T] | undefined {
        try {
            const value = this.configService.getOrThrow(key, {
                infer: true,
            });
            if (value === 'true' || value === 'false') {
                return value === 'true' ? (true as Env[T]) : (false as Env[T]);
            }
            return value as Env[T];
        } catch {
            return undefined;
        }
    }

    set<T extends keyof Env>(key: T, value: Env[T]): void {
        if (!this.get(key) || this.get(key) !== value) {
            this.configService.set(key, value);
        }
    }

    isProduction(): boolean {
        return this.env === ENVIRONMENTS.Production;
    }

    isDevelopmentOrStaging(): boolean {
        return (
            this.env === ENVIRONMENTS.Development ||
            this.env === ENVIRONMENTS.Staging
        );
    }

    isDevelopmentOrStagingOrPreprod(): boolean {
        return (
            this.env === ENVIRONMENTS.Development ||
            this.env === ENVIRONMENTS.Staging ||
            this.env === ENVIRONMENTS.Preprod
        );
    }

    getApiDocCreds(): API_DOC {
        return {
            name: this.get('SWAGGER_NAME') || '',
            pass: this.get('SWAGGER_PASS') || '',
        };
    }

    getWebsiteConfigs<T>(key: keyof Env): T | undefined {
        try {
            const value = this.configService.get(key, { infer: true });
            if (typeof value === 'string' && typeof key === 'string') {
                if (
                    key.includes('EMAIL_TO') ||
                    key.includes('SMS_RECEIVER_NUMBER') ||
                    key.includes('WEBHOOK_URL')
                ) {
                    return value.split(',').map((v) => v.trim()) as T;
                }

                if (key.includes('QUEUE_TYPE')) {
                    return value
                        .split(',')
                        .map((v) => v.trim() as 'kafka' | 'rmq') as T;
                }

                if (
                    key.includes('CUSTOM_RESTART_COMMAND') ||
                    key.includes('CUSTOM_CHECK_TRANSITIONAL_COMMAND')
                ) {
                    const sanitizedValue = sanitizeCommand(value);
                    if (!sanitizedValue) {
                        throw new Error(
                            `Invalid command detected for ${key}: ${value}`,
                        );
                    }
                    return sanitizedValue as T;
                }
            }
            return value as T;
        } catch {
            return undefined;
        }
    }
}
