import { Test } from '@nestjs/testing';
import { SendHostNotificationUseCase } from '@application/notification/use-cases/send-host-notification.use-case';
import { SendHostRestartedNotificationUseCase } from '@application/host/use-cases/send-host-restarted-notification.use-case';
import { SendHostManualInterventionNotificationUseCase } from '@application/host/use-cases/send-host-manual-intervention-notification.use-case';
import { ConfigurationService } from '@core/configuration.service';
import { HOST_EVENT_NAMES } from '@common/domains/host';
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

describe('SendHostNotificationUseCase', () => {
    let useCase: SendHostNotificationUseCase;
    let sendHostRestartedNotificationUseCase: SendHostRestartedNotificationUseCase;
    let sendHostManualInterventionNotificationUseCase: SendHostManualInterventionNotificationUseCase;
    let configurationService: ConfigurationService;
    beforeEach(async () => {
        const mockSendHostRestartedNotificationUseCase = {
            execute: jest.fn().mockResolvedValue(undefined),
        };
        const mockSendHostManualInterventionNotificationUseCase = {
            execute: jest.fn().mockResolvedValue(undefined),
        };
        const mockConfigurationService = {
            get: jest.fn(),
        };
        const moduleRef = await Test.createTestingModule({
            providers: [
                SendHostNotificationUseCase,
                {
                    provide: SendHostRestartedNotificationUseCase,
                    useValue: mockSendHostRestartedNotificationUseCase,
                },
                {
                    provide: SendHostManualInterventionNotificationUseCase,
                    useValue: mockSendHostManualInterventionNotificationUseCase,
                },
                {
                    provide: ConfigurationService,
                    useValue: mockConfigurationService,
                },
            ],
        }).compile();
        useCase = moduleRef.get<SendHostNotificationUseCase>(
            SendHostNotificationUseCase,
        );
        sendHostRestartedNotificationUseCase =
            moduleRef.get<SendHostRestartedNotificationUseCase>(
                SendHostRestartedNotificationUseCase,
            );
        sendHostManualInterventionNotificationUseCase =
            moduleRef.get<SendHostManualInterventionNotificationUseCase>(
                SendHostManualInterventionNotificationUseCase,
            );
        configurationService =
            moduleRef.get<ConfigurationService>(ConfigurationService);
        jest.clearAllMocks();
    });

    it('should execute SendHostRestartedNotificationUseCase for HOST_RESTARTED_EVENT', async () => {
        const hostId = `${ID_PREFIXES.HOST}123`;
        await useCase.execute(hostId, HOST_EVENT_NAMES.HOST_RESTARTED_EVENT);
        expect(
            sendHostRestartedNotificationUseCase.execute,
        ).toHaveBeenCalledWith(
            hostId,
            expect.objectContaining({
                websiteId: '123',
                name: 'Test Website',
                url: 'https://example.com',
            }),
            HOST_EVENT_NAMES.HOST_RESTARTED_EVENT,
        );
        expect(
            sendHostManualInterventionNotificationUseCase.execute,
        ).not.toHaveBeenCalled();
    });

    it('should execute SendHostManualInterventionNotificationUseCase for HOST_MANUAL_INTERVENTION_EVENT', async () => {
        const hostId = `${ID_PREFIXES.HOST}123`;
        await useCase.execute(
            hostId,
            HOST_EVENT_NAMES.HOST_MANUAL_INTERVENTION_EVENT,
        );
        expect(
            sendHostManualInterventionNotificationUseCase.execute,
        ).toHaveBeenCalledWith(
            hostId,
            expect.objectContaining({
                websiteId: '123',
                name: 'Test Website',
                url: 'https://example.com',
            }),
            HOST_EVENT_NAMES.HOST_MANUAL_INTERVENTION_EVENT,
        );
        expect(
            sendHostRestartedNotificationUseCase.execute,
        ).not.toHaveBeenCalled();
    });

    it('should throw error for unsupported event', async () => {
        const hostId = `${ID_PREFIXES.HOST}123`;
        await expect(
            useCase.execute(hostId, 'UNSUPPORTED_EVENT'),
        ).rejects.toThrow(`Unsupported event for ID: ${hostId}`);
        expect(
            sendHostRestartedNotificationUseCase.execute,
        ).not.toHaveBeenCalled();
        expect(
            sendHostManualInterventionNotificationUseCase.execute,
        ).not.toHaveBeenCalled();
    });
});
