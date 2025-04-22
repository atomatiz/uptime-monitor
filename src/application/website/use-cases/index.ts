import { SendWebsiteDownNotificationUseCase } from './send-website-down-notification.use-case';
import { SendWebsiteUpNotificationUseCase } from './send-website-up-notification.use-case';
import { TrackWebsiteUseCase } from './track-website.use-case';

export const WebsiteUseCases = [
    SendWebsiteDownNotificationUseCase,
    SendWebsiteUpNotificationUseCase,
    TrackWebsiteUseCase,
];
