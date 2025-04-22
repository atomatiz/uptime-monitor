import { ENVIRONMENTS } from '@common/constants/global.constants';
import { z } from 'zod';

export const envSchema = z
    .object({
        NODE_ENV: z
            .enum([
                ENVIRONMENTS.Development,
                ENVIRONMENTS.Production,
                ENVIRONMENTS.Staging,
                ENVIRONMENTS.Preprod,
                ENVIRONMENTS.Test,
            ])
            .default(ENVIRONMENTS.Development),
        PORT: z.coerce.number().default(8000),
        APP_NAME: z.string().default('Uptime Monitor'),
        LANG_CODE: z.enum(['en', 'vi']).default('en'),
        ENABLE_SCHEDULING: z.string().default('true'),
        JWT_SECRET_KEY: z.string(),
        CSRF_SECRET_KEY: z.string(),
        HTTP_CACHE_TTL: z.coerce.number().optional(),
        HTTP_CACHE_MAX: z.coerce.number().optional(),
        ALLOWED_ORIGINS: z.string().default('*'),
        WEBSITE_DOWNTIME_THRESHOLD: z.coerce.number().default(60000),
        HOST_STARTUP_THRESHOLD: z.coerce.number().default(120000),
        HOST_RESTART_ATTEMPTS: z.coerce.number().default(2),
        API_RETRY_ATTEMPTS: z.coerce.number().default(2),
        API_TOKEN: z.string().optional(),
        NOTIFICATION_AVATAR_URL: z
            .string()
            .url()
            .default('https://example.com'),
        TIMEZONE: z.string().default('UTC'),
        SWAGGER_NAME: z.string().optional(),
        SWAGGER_PASS: z.string().optional(),
    })
    .catchall(z.any());

export type Env = z.infer<typeof envSchema>;
