import axios from 'axios';
import { INotificationClient } from '@common/domains/notification/interfaces/notification.interface';
import { LoggingService } from '@core/logging.service';
import { errorMessage } from '@common/utils/error-message.utils';
import { getWebhookType } from '@common/utils/webhook.utils';
import { HTTP_METHODS } from '@common/constants/http.constants';

export class WebhookClient implements Partial<INotificationClient> {
    private readonly logger = new LoggingService(WebhookClient.name);

    async sendWebhook(url: string, message: any): Promise<boolean> {
        try {
            let payload;
            const type = getWebhookType(url);

            switch (type) {
                case 'discord':
                    payload = {
                        content: message,
                        username: 'Uptime Bot',
                        avatar_url:
                            process.env.NOTIFICATION_AVATAR_URL ?? undefined,
                    };
                    break;
                case 'slack':
                    payload = {
                        text: message,
                        icon_emoji: ':warning:',
                    };
                    break;
                case 'teams':
                    payload = {
                        '@type': 'MessageCard',
                        '@context': 'http://schema.org/extensions',
                        themeColor: '0076D7',
                        summary: 'Uptime Monitor Alert',
                        sections: [
                            {
                                activityTitle: 'Uptime Bot',
                                activitySubtitle: new Date().toISOString(),
                                text: message,
                            },
                        ],
                    };
                    break;
                default:
                    payload = {
                        message: message,
                        timestamp: new Date().toISOString(),
                        source: 'Uptime Monitor',
                    };
            }

            await axios(url, {
                method: HTTP_METHODS.POST,
                data: payload,
                timeout: 5000,
                headers: {
                    'Content-Type': 'application/json',
                },
            });

            this.logger.debug(
                `Webhook message sent to ${type ? type.toLocaleUpperCase() : 'webhook'}: ${url}}`,
            );
            return true;
        } catch (error: unknown) {
            this.logger.error(
                errorMessage(`Failed to send webhook to ${url}`, error),
            );
            throw error;
        }
    }
}
