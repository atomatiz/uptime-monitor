import { ProcessWebsiteDownNotificationProcessor } from './process-website-down-notification.processor';
import { ProcessWebsiteUpNotificationProcessor } from './process-website-up-notification.processor';

export const WebsiteProcessors = [
    ProcessWebsiteDownNotificationProcessor,
    ProcessWebsiteUpNotificationProcessor,
];
