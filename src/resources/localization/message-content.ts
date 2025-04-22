import { DEFAULT_TIMEZONE } from '@common/constants/global.constants';
import { getFormattedDateTime } from '@common/utils/date.utils';
import translations from '@common/utils/translation-loader.utils';

export function getWebsiteUpMessage({
    url,
    totalDowntime,
}: {
    url: string;
    totalDowntime: number;
}): string {
    const line1 = translations['website_up'].line1.replace('{{url}}', url);
    const downtimeMinutes = totalDowntime / (1000 * 60);
    let downtimeFormatted: string;
    if (downtimeMinutes < 1) {
        const seconds = Math.round(downtimeMinutes * 60);
        downtimeFormatted = `${seconds} ${seconds === 1 ? 'second' : 'seconds'}`;
    } else if (downtimeMinutes < 60) {
        const minutes = Math.round(downtimeMinutes);
        downtimeFormatted = `${minutes} ${minutes === 1 ? 'minute' : 'minutes'}`;
    } else {
        const hours = (downtimeMinutes / 60).toFixed(2);
        downtimeFormatted = hours === '1.00' ? '1 hour' : `${hours} hours`;
    }

    const line2 = translations['website_up'].line2.replace(
        '{{totalDowntime}}',
        downtimeFormatted,
    );

    return `${line1}\n${line2}`;
}

export function getWebsiteDownMessage({
    url,
    lastDownTime,
}: {
    url: string;
    lastDownTime: Date;
}): string {
    const line1 = translations['website_down'].line1.replace('{{url}}', url);
    const line2 = translations['website_down'].line2.replace(
        '{{lastDownTime}}',
        getFormattedDateTime(
            lastDownTime,
            process.env.TIMEZONE ?? DEFAULT_TIMEZONE,
        ),
    );

    return `${line1}\n${line2}`;
}

export function getHostRestartedMessage({
    url,
    instanceId,
    updatedAt,
}: {
    url: string;
    instanceId: string;
    updatedAt: Date;
}): string {
    const line1 = translations['host_restarted'].line1
        .replace('{{instanceId}}', instanceId)
        .replace('{{url}}', url);
    const line2 = translations['host_restarted'].line2.replace(
        '{{updatedAt}}',
        getFormattedDateTime(
            updatedAt,
            process.env.TIMEZONE ?? DEFAULT_TIMEZONE,
        ),
    );

    return `${line1}\n${line2}`;
}

export function getHostManualInterventionMessage({
    websiteUrl,
    instanceId,
    maxRestartAttempts,
    updatedAt,
}: {
    websiteUrl: string;
    instanceId: string;
    maxRestartAttempts: number;
    updatedAt: Date;
}): string {
    const line1 = translations['host_manual_intervention'].line1.replace(
        '{{instanceId}}',
        instanceId,
    );
    const line2 = translations['host_manual_intervention'].line2.replace(
        '{{maxRestartAttempts}}',
        maxRestartAttempts?.toString(),
    );
    const line3 = translations['host_manual_intervention'].line3
        .replace('{{websiteUrl}}', websiteUrl)
        .replace(
            '{{updatedAt}}',
            getFormattedDateTime(
                updatedAt,
                process.env.TIMEZONE ?? DEFAULT_TIMEZONE,
            ),
        );

    return `${line1}\n${line2}\n${line3}`;
}
