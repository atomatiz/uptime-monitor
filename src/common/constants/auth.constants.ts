export const TOKEN_EXPIRATION_TIME = 60 * 60;

export const DEVICE_OS = {
    MAC: 'Mac computer(s)',
    WINDOWS: 'Windows computer(s)',
    LINUX: 'Linux computer(s)',
    IPHONE: 'iPhone(s)',
    IPAD: 'iPad(s)',
    ANDROID: 'Android phone(s)',
    TABLET: 'Android tablet(s)',
    UNKNOWN: 'Unknown device(s)',
    OTHER: 'Other device(s)',
} as const;

export const OSID = {
    MAC: 1,
    WINDOWS: 2,
    LINUX: 3,
    IPHONE: 4,
    IPAD: 5,
    ANDROID: 6,
    TABLET: 7,
    UNKNOWN: 8,
    OTHER: 9,
} as const;
