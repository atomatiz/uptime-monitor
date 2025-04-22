import { HostManualInterventionEventHandler } from './host-manual-intervention.event-handler';
import { HostRestartedEventHandler } from './host-restarted.event-handler';

export const HostEventHandlers = [
    HostManualInterventionEventHandler,
    HostRestartedEventHandler,
];
