import { EmailClient } from './email.client';
import { SMSClient } from './sms.client';
import { WebhookClient } from './webhook.client';

export const NotificationClients = [EmailClient, SMSClient, WebhookClient];
