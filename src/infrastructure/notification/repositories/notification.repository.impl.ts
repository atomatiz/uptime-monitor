import { Injectable } from '@nestjs/common';
import Twilio from 'twilio';
import * as nodemailer from 'nodemailer';
import { EmailClient } from '@infrastructure/clients/notifications/email.client';
import { SMSClient } from '@infrastructure/clients/notifications/sms.client';
import { WebhookClient } from '@infrastructure/clients/notifications/webhook.client';
import { NotificationRepository } from '@application/notification/repositories/notification.repository';
import { Config } from '@common/interfaces';
import { NOTIFICATION_CHANNELS } from '@common/domains/notification';
import { errorMessage } from '@common/utils';
import { NotificationMapper } from '../mapper/notification.mapper';
import { LoggingService } from '@core/logging.service';
import { Nullable } from '@common/types';

interface ITransportClient {
    transporter: Twilio.Twilio | nodemailer.Transporter;
    from: string;
    to: string[];
}

@Injectable()
export class NotificationRepositoryImpl extends NotificationRepository {
    private readonly logger = new LoggingService(
        NotificationRepositoryImpl.name,
    );
    private clientConfigMap: Map<string, ITransportClient> = new Map();
    private clientsMap: Map<string, Nullable<Array<EmailClient | SMSClient>>> =
        new Map();

    constructor(
        private readonly webhookClient: WebhookClient,
        private readonly emailClient: EmailClient,
        private readonly smsClient: SMSClient,
    ) {
        super();
    }

    private storeNotificationClients(
        aggregateId: string,
        config: Config,
    ): void {
        if (
            !this.clientConfigMap.has(aggregateId) &&
            !this.clientsMap.has(aggregateId)
        ) {
            if (!config || config.channels.length <= 0) {
                throw new Error(`Config not found for ID: ${aggregateId}`);
            }

            const clients: Array<EmailClient | SMSClient> = [];

            let transporter: Twilio.Twilio | nodemailer.Transporter;

            const smsConfig = config.channels.find(
                (c) => c.type === NOTIFICATION_CHANNELS.SMS,
            )?.sms;
            const emailConfig = config.channels.find(
                (c) => c.type === NOTIFICATION_CHANNELS.EMAIL,
            )?.email;

            if (smsConfig) {
                transporter = new Twilio.Twilio(
                    smsConfig.accountSid,
                    smsConfig.authToken,
                );
                this.clientConfigMap.set(aggregateId, {
                    transporter,
                    from: smsConfig.phoneNumber,
                    to: smsConfig.receivers,
                });
                this.logger.log(
                    `Twilio client initialized for ID: ${aggregateId}`,
                );
                clients.push(this.smsClient);
            }

            if (emailConfig) {
                transporter = nodemailer.createTransport({
                    host: emailConfig.host,
                    port: +emailConfig.port,
                    secure: emailConfig.port === 465,
                    auth: {
                        user: emailConfig.from,
                        pass: emailConfig.pass,
                    },
                });
                this.clientConfigMap.set(aggregateId, {
                    transporter,
                    from: emailConfig.from,
                    to: emailConfig.receivers,
                });
                this.logger.log(
                    `Email transporter initialized for ID: ${aggregateId}`,
                );
                clients.push(this.emailClient);
            }
            this.clientsMap.set(aggregateId, clients);
        }
    }

    async sendWebhook(
        url: string,
        message: string | any,
    ): Promise<void | boolean> {
        const result = await this.webhookClient.sendWebhook(url, message);
        return NotificationMapper.toDomain(result);
    }

    async sendEmail(
        aggregateId: string,
        config: Config,
        subject: string,
        html: string,
    ): Promise<void | boolean> {
        let result: boolean = false;
        try {
            this.storeNotificationClients(aggregateId, config);
            const clients = this.clientsMap.get(aggregateId);
            const clientData = this.clientConfigMap.get(aggregateId);
            if (!clients || !clients.length || !clientData) {
                throw new Error(
                    `No e-mail client ${!clients || !clients.length ? 'configs' : !clientData ? 'data' : 'configs and data'} found for ID: ${aggregateId}`,
                );
            }
            const { transporter, from, to } = clientData;
            clients.forEach(async (client) => {
                if (!(client instanceof EmailClient)) {
                    return NotificationMapper.toDomain(false);
                }
                result = await client.sendEmail(
                    transporter as nodemailer.Transporter,
                    from,
                    to,
                    subject,
                    html,
                );
            });
        } catch (error: unknown) {
            this.logger.error(
                errorMessage(
                    `Error sending e-mail for ID: ${aggregateId}`,
                    error,
                ),
            );
            result = false;
        }
        return NotificationMapper.toDomain(result);
    }

    async sendSMS(
        aggregateId: string,
        config: Config,
        message: string,
    ): Promise<void | boolean> {
        let result: boolean = false;
        try {
            this.storeNotificationClients(aggregateId, config);
            const clients = this.clientsMap.get(aggregateId);
            const clientData = this.clientConfigMap.get(aggregateId);
            if (!clients || !clients.length || !clientData) {
                throw new Error(
                    `No sms client ${!clients || !clients.length ? 'configs' : !clientData ? 'data' : 'configs and data'} found for ID: ${aggregateId}`,
                );
            }
            const { transporter, from, to } = clientData;
            clients.forEach(async (client) => {
                if (!(client instanceof SMSClient)) {
                    return NotificationMapper.toDomain(false);
                }
                result = await client.sendSMS(
                    transporter as Twilio.Twilio,
                    from,
                    to,
                    message,
                );
            });
        } catch (error: unknown) {
            this.logger.error(
                errorMessage(`Error sending sms for ID: ${aggregateId}`, error),
            );
            result = false;
        }

        return NotificationMapper.toDomain(result);
    }
}
