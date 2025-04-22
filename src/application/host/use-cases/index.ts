import { RestartHostUseCase } from './restart-host.use-case';
import { SendHostManualInterventionNotificationUseCase } from './send-host-manual-intervention-notification.use-case';
import { SendHostRestartedNotificationUseCase } from './send-host-restarted-notification.use-case';

export const HostUseCases = [
    RestartHostUseCase,
    SendHostRestartedNotificationUseCase,
    SendHostManualInterventionNotificationUseCase,
];
