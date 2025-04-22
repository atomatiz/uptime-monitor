import { Test } from '@nestjs/testing';
import { SendWebsiteNotificationUseCase } from '@application/notification/use-cases/send-website-notification.use-case';
import { SendWebsiteDownNotificationUseCase } from '@application/website/use-cases/send-website-down-notification.use-case';
import { SendWebsiteUpNotificationUseCase } from '@application/website/use-cases/send-website-up-notification.use-case';
import { ConfigurationService } from '@core/configuration.service';
import { WEBSITE_EVENT_NAMES } from '@common/domains/website';
import { ID_PREFIXES } from '@common/constants';

jest.mock('@common/configs', () => ({
    generateWebsiteConfigs: jest.fn().mockReturnValue([
        {
            websiteId: '123',
            name: 'Test Website',
            url: 'https://example.com',
        },
    ]),
}));

describe('SendWebsiteNotificationUseCase', () => {
    let useCase: SendWebsiteNotificationUseCase;
    let sendWebsiteDownNotificationUseCase: SendWebsiteDownNotificationUseCase;
    let sendWebsiteUpNotificationUseCase: SendWebsiteUpNotificationUseCase;
    let configurationService: ConfigurationService;
    beforeEach(async () => {
        const mockSendWebsiteDownNotificationUseCase = {
            execute: jest.fn().mockResolvedValue(undefined),
        };
        const mockSendWebsiteUpNotificationUseCase = {
            execute: jest.fn().mockResolvedValue(undefined),
        };
        const mockConfigurationService = {
            get: jest.fn(),
        };
        const moduleRef = await Test.createTestingModule({
            providers: [
                SendWebsiteNotificationUseCase,
                {
                    provide: SendWebsiteDownNotificationUseCase,
                    useValue: mockSendWebsiteDownNotificationUseCase,
                },
                {
                    provide: SendWebsiteUpNotificationUseCase,
                    useValue: mockSendWebsiteUpNotificationUseCase,
                },
                {
                    provide: ConfigurationService,
                    useValue: mockConfigurationService,
                },
            ],
        }).compile();
        useCase = moduleRef.get<SendWebsiteNotificationUseCase>(
            SendWebsiteNotificationUseCase,
        );
        sendWebsiteDownNotificationUseCase =
            moduleRef.get<SendWebsiteDownNotificationUseCase>(
                SendWebsiteDownNotificationUseCase,
            );
        sendWebsiteUpNotificationUseCase =
            moduleRef.get<SendWebsiteUpNotificationUseCase>(
                SendWebsiteUpNotificationUseCase,
            );
        configurationService =
            moduleRef.get<ConfigurationService>(ConfigurationService);
        jest.clearAllMocks();
    });

    it('should execute SendWebsiteDownNotificationUseCase for WEBSITE_DOWN_EVENT', async () => {
        const websiteId = `${ID_PREFIXES.WEBSITE}123`;
        await useCase.execute(
            websiteId,
            WEBSITE_EVENT_NAMES.WEBSITE_DOWN_EVENT,
        );
        expect(sendWebsiteDownNotificationUseCase.execute).toHaveBeenCalledWith(
            websiteId,
            expect.objectContaining({
                websiteId: '123',
                name: 'Test Website',
                url: 'https://example.com',
            }),
            WEBSITE_EVENT_NAMES.WEBSITE_DOWN_EVENT,
        );
        expect(sendWebsiteUpNotificationUseCase.execute).not.toHaveBeenCalled();
    });

    it('should execute SendWebsiteUpNotificationUseCase for WEBSITE_UP_EVENT', async () => {
        const websiteId = `${ID_PREFIXES.WEBSITE}123`;
        await useCase.execute(websiteId, WEBSITE_EVENT_NAMES.WEBSITE_UP_EVENT);
        expect(sendWebsiteUpNotificationUseCase.execute).toHaveBeenCalledWith(
            websiteId,
            expect.objectContaining({
                websiteId: '123',
                name: 'Test Website',
                url: 'https://example.com',
            }),
            WEBSITE_EVENT_NAMES.WEBSITE_UP_EVENT,
        );
        expect(
            sendWebsiteDownNotificationUseCase.execute,
        ).not.toHaveBeenCalled();
    });

    it('should throw error for unsupported event', async () => {
        const websiteId = `${ID_PREFIXES.WEBSITE}123`;
        await expect(
            useCase.execute(websiteId, 'UNSUPPORTED_EVENT'),
        ).rejects.toThrow(`Unsupported event for ID: ${websiteId}`);
        expect(
            sendWebsiteDownNotificationUseCase.execute,
        ).not.toHaveBeenCalled();
        expect(sendWebsiteUpNotificationUseCase.execute).not.toHaveBeenCalled();
    });
});
