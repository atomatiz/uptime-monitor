export const NOTIFICATION_CHANNELS = {
    WEBHOOK: 'webhook',
    EMAIL: 'email',
    SMS: 'sms',
    QUEUE: 'queue',
} as const;

export const QUEUE_TYPES = {
    KAFKA: 'kafka',
    RABBITMQ: 'rmq',
} as const;

export const NOTIFICATION_ID_SUFFIXES = {
    WEBSITE_DOWN: 'website-down',
    WEBSITE_UP: 'website-up',
    HOST_RESTARTED: 'host-restarted',
    HOST_MANUAL_INTERVENTION: 'host-manual-intervention',
} as const;
