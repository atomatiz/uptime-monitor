import {
    NOTIFICATION_CHANNELS,
    NOTIFICATION_CONTENT_TYPE,
} from '@common/domains/notification';
import { ChannelConfig } from '@common/interfaces';

export class NotificationContentFactory {
    static determineOutput(
        channels: ChannelConfig[],
    ): NOTIFICATION_CONTENT_TYPE {
        const enabledChannels = channels
            .filter((ch) => ch.type)
            .map((ch) => ch.type);
        if (!enabledChannels.length || enabledChannels.length === 0) {
            throw new Error(`No notification channels enabled`);
        }

        if (
            (enabledChannels.includes(NOTIFICATION_CHANNELS.WEBHOOK) &&
                enabledChannels.includes(NOTIFICATION_CHANNELS.EMAIL) &&
                enabledChannels.includes(NOTIFICATION_CHANNELS.SMS)) ||
            (enabledChannels.includes(NOTIFICATION_CHANNELS.EMAIL) &&
                (enabledChannels.includes(NOTIFICATION_CHANNELS.WEBHOOK) ||
                    enabledChannels.includes(NOTIFICATION_CHANNELS.SMS)))
        ) {
            return {
                plainText: true,
                html: true,
            };
        } else if (
            (enabledChannels.includes(NOTIFICATION_CHANNELS.WEBHOOK) ||
                enabledChannels.includes(NOTIFICATION_CHANNELS.SMS)) &&
            !enabledChannels.includes(NOTIFICATION_CHANNELS.EMAIL)
        ) {
            return {
                plainText: true,
                html: false,
            };
        } else if (
            enabledChannels.includes(NOTIFICATION_CHANNELS.EMAIL) &&
            !enabledChannels.includes(NOTIFICATION_CHANNELS.SMS) &&
            !enabledChannels.includes(NOTIFICATION_CHANNELS.WEBHOOK)
        ) {
            return {
                plainText: false,
                html: true,
            };
        } else {
            return {
                plainText: false,
                html: false,
            };
        }
    }
}
