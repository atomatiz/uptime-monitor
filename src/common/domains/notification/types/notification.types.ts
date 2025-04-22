import {
    NOTIFICATION_CHANNELS,
    QUEUE_TYPES,
} from '../constants/notification.constants';

export type NOTIFICATION_CHANNEL =
    (typeof NOTIFICATION_CHANNELS)[keyof typeof NOTIFICATION_CHANNELS];

export type QUEUE_TYPE = (typeof QUEUE_TYPES)[keyof typeof QUEUE_TYPES];

export type NOTIFICATION_CONTENT_TYPE = {
    plainText: boolean;
    html: boolean;
};
