export const ENVIRONMENTS = {
    Development: 'development',
    Production: 'production',
    Staging: 'staging',
    Preprod: 'preprod',
    Test: 'test',
} as const;

export const API_VERSION: string = '/v1/api';
export const API_DOC_VERSION: string = `${API_VERSION}/doc`;
export const URL_REGEX_PATTERN =
    /^(https?:\/\/)(?:w{1,3}\.)?[^\s.]+(?:\.[a-z]+)*(?::\d+)?(?![^<]*(?:<\/\w+>|\/?>))$/;

export const DEFAULT_TIMEZONE: string = 'UTC';
export const DEFAULT_SYSTEM_ROLE: string = 'system';

export const DOMAINS = {
    WEBSITE: 'website',
    HOST: 'host',
    NOTIFICATION: 'notification',
} as const;

export const ID_PREFIXES = {
    WEBSITE: 'website-',
    HOST: 'host-',
    NOTIFICATION: 'notification-',
} as const;
