import { ProcessQueueCommandHandler } from './process-queue.command-handler';
import { SendNotificationCommandHandler } from './send-notification.command-handler';

export const NotificationCommandHandlers = [
    SendNotificationCommandHandler,
    ProcessQueueCommandHandler,
];
