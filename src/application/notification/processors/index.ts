import { ProcessHostQueueProcessor } from './process-host-queue.processor';
import { ProcessWebsiteQueueProcessor } from './process-website-queue.processor';

export const NotificationProcessors = [
    ProcessHostQueueProcessor,
    ProcessWebsiteQueueProcessor,
];
