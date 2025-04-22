import Twilio from 'twilio';
import { INotificationClient } from '@common/domains/notification/interfaces/notification.interface';
import { LoggingService } from '@core/logging.service';
import { errorMessage } from '@common/utils/error-message.utils';

export class SMSClient implements Partial<INotificationClient> {
    private readonly logger = new LoggingService(SMSClient.name);

    async sendSMS(
        transporter: Twilio.Twilio,
        from: string,
        to: string[],
        message: string,
    ): Promise<boolean> {
        try {
            await Promise.all(
                to.map((receiver) =>
                    transporter.messages.create({
                        body: message,
                        from: from,
                        to: receiver,
                    }),
                ),
            );
            this.logger.debug(`SMS sent to ${to.join(', ')}`);
            return true;
        } catch (error: unknown) {
            this.logger.error(
                errorMessage(`Failed to send SMS to ${to.join(', ')}`, error),
            );
            throw error;
        }
    }
}
