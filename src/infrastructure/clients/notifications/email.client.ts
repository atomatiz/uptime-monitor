import * as nodemailer from 'nodemailer';
import { LoggingService } from '@core/logging.service';
import { INotificationClient } from '@common/domains/notification/interfaces/notification.interface';
import { errorMessage } from '@common/utils/error-message.utils';

export class EmailClient implements Partial<INotificationClient> {
    private readonly logger = new LoggingService(EmailClient.name);

    async sendEmail(
        transporter: nodemailer.Transporter,
        from: string,
        to: string[],
        subject: string,
        html: string,
    ): Promise<boolean> {
        try {
            await transporter.sendMail({
                from: from,
                to: to.join(','),
                subject,
                html,
            });
            this.logger.debug(`Email sent to ${to.join(', ')}`);
            return true;
        } catch (error: unknown) {
            this.logger.error(
                errorMessage(`Failed to send email to ${to.join(', ')}`, error),
            );
            throw error;
        }
    }
}
