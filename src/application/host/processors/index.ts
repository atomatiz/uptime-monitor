import { ProcessHostManualInterventionNotificationProcessor } from './process-host-manual-intervention.processor';
import { ProcessHostRestartedNotificationProcessor } from './process-host-restarted-notification.processor';

export const HostProcessors = [
    ProcessHostRestartedNotificationProcessor,
    ProcessHostManualInterventionNotificationProcessor,
];
