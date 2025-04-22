import * as nodemailer from 'nodemailer';
import Twilio from 'twilio';

export interface INotificationClient {
    sendWebhook(url: string, message: string): Promise<void | boolean>;
    sendEmail(
        transporter: nodemailer.Transporter,
        from: string,
        to: string[],
        subject: string,
        html: string,
    ): Promise<void | boolean>;
    sendSMS(
        transporter: Twilio.Twilio,
        from: string,
        to: string[],
        message: string,
    ): Promise<void | boolean>;
}
