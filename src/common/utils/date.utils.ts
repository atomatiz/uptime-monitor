import { DateTime } from 'luxon';

export const getFormattedDateTime = (date: Date, timezone: string): string => {
    return DateTime.fromJSDate(date)
        .setZone(timezone)
        .toFormat('yyyy-MM-dd HH:mm:ss z');
};

export const getYear = (date: Date, timezone: string): string => {
    return DateTime.fromJSDate(date).setZone(timezone).toFormat('yyyy');
};
