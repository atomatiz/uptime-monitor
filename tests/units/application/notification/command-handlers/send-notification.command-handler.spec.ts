import { Test } from '@nestjs/testing';
import { SendNotificationCommandHandler } from '@application/notification/command-handlers/send-notification.command-handler';
import { SendWebsiteNotificationUseCase } from '@application/notification/use-cases/send-website-notification.use-case';
import { SendHostNotificationUseCase } from '@application/notification/use-cases/send-host-notification.use-case';
import { SendNotificationCommand } from '@domain/notification/commands/send-notification.command';
import { DOMAINS } from '@common/constants';
import { WEBSITE_EVENT_NAMES } from '@common/domains/website';
import { HOST_EVENT_NAMES } from '@common/domains/host';

describe('SendNotificationCommandHandler', () => {
    let handler: SendNotificationCommandHandler;
    let sendWebsiteNotificationUseCase: SendWebsiteNotificationUseCase;
    let sendHostNotificationUseCase: SendHostNotificationUseCase;
    beforeEach(async () => {
        const mockSendWebsiteNotificationUseCase = {
            execute: jest.fn().mockResolvedValue(undefined),
        };
        const mockSendHostNotificationUseCase = {
            execute: jest.fn().mockResolvedValue(undefined),
        };
        const moduleRef = await Test.createTestingModule({
            providers: [
                SendNotificationCommandHandler,
                {
                    provide: SendWebsiteNotificationUseCase,
                    useValue: mockSendWebsiteNotificationUseCase,
                },
                {
                    provide: SendHostNotificationUseCase,
                    useValue: mockSendHostNotificationUseCase,
                },
            ],
        }).compile();
        handler = moduleRef.get<SendNotificationCommandHandler>(
            SendNotificationCommandHandler,
        );
        sendWebsiteNotificationUseCase =
            moduleRef.get<SendWebsiteNotificationUseCase>(
                SendWebsiteNotificationUseCase,
            );
        sendHostNotificationUseCase =
            moduleRef.get<SendHostNotificationUseCase>(
                SendHostNotificationUseCase,
            );
        jest.clearAllMocks();
    });
    it('should execute SendWebsiteNotificationUseCase for website domain type', async () => {
        const command = new SendNotificationCommand(
            'website-123',
            DOMAINS.WEBSITE,
            WEBSITE_EVENT_NAMES.WEBSITE_DOWN_EVENT,
        );
        await handler.execute(command);
        expect(sendWebsiteNotificationUseCase.execute).toHaveBeenCalledWith(
            'website-123',
            WEBSITE_EVENT_NAMES.WEBSITE_DOWN_EVENT,
        );
        expect(sendHostNotificationUseCase.execute).not.toHaveBeenCalled();
    });
    it('should execute SendHostNotificationUseCase for host domain type', async () => {
        const command = new SendNotificationCommand(
            'host-123',
            DOMAINS.HOST,
            HOST_EVENT_NAMES.HOST_MANUAL_INTERVENTION_EVENT,
        );
        await handler.execute(command);
        expect(sendHostNotificationUseCase.execute).toHaveBeenCalledWith(
            'host-123',
            HOST_EVENT_NAMES.HOST_MANUAL_INTERVENTION_EVENT,
        );
        expect(sendWebsiteNotificationUseCase.execute).not.toHaveBeenCalled();
    });
    it('should do nothing for notification domain type', async () => {
        const command = new SendNotificationCommand(
            'notification-123',
            DOMAINS.NOTIFICATION,
            'some-event',
        );
        await handler.execute(command);
        expect(sendWebsiteNotificationUseCase.execute).not.toHaveBeenCalled();
        expect(sendHostNotificationUseCase.execute).not.toHaveBeenCalled();
    });
    it('should throw error for unsupported domain type', async () => {
        const command = new SendNotificationCommand(
            'unknown-123',
            'UNKNOWN_DOMAIN' as any,
            'some-event',
        );
        await expect(handler.execute(command)).rejects.toThrow(
            'Unsupported domain type for ID: unknown-123',
        );
        expect(sendWebsiteNotificationUseCase.execute).not.toHaveBeenCalled();
        expect(sendHostNotificationUseCase.execute).not.toHaveBeenCalled();
    });
});
