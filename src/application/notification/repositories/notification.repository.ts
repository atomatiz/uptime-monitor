import { Config } from '@common/interfaces';

export abstract class NotificationRepository {
    abstract sendWebhook(url: string, message: string): Promise<void | boolean>;
    abstract sendEmail(
        aggregateId: string,
        config: Config,
        subject: string,
        html: string,
    ): Promise<void | boolean>;
    abstract sendSMS(
        aggregateId: string,
        config: Config,
        message: string,
    ): Promise<void | boolean>;
}
