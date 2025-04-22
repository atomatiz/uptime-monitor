import { ProcessWebsiteDownNotificationProcessor } from '@application/website/processors/process-website-down-notification.processor';
import { QueueRepository } from '@application/notification/repositories/queue.repository';
import { NotificationRepository } from '@application/notification/repositories/notification.repository';
import { CommandBus } from '@nestjs/cqrs';
import { Notification } from '@domain/notification/notification.entity';
import { Website } from '@domain/website/website.entity';
import { Host } from '@domain/host/host.entity';
import aggregateStore from '@domain/aggregate-store';
import { RestartHostCommand } from '@domain/host/commands/restart-host.command';
import { Config } from '@common/interfaces';
import { NOTIFICATION_CHANNELS } from '@common/domains/notification';

jest.setTimeout(15000);
jest.mock('@domain/aggregate-store', () => ({
    __esModule: true,
    default: {
        get: jest.fn(),
    },
}));

describe('ProcessWebsiteDownNotificationProcessor', () => {
    let processor: ProcessWebsiteDownNotificationProcessor;
    let queueRepository: QueueRepository;
    let notificationRepository: NotificationRepository;
    let commandBus: CommandBus;
    let mockNotification: Notification;
    let mockWebsite: Website;
    let mockHost: Host;
    let mockConfig: Config;

    beforeEach(() => {
        queueRepository = {
            consume: jest.fn().mockImplementation((id, config, callback) => {
                callback({
                    aggregateId: 'notification-123',
                    eventName: 'WEBSITE_DOWN_EVENT',
                });
                return Promise.resolve();
            }),
        } as unknown as QueueRepository;

        notificationRepository = {
            sendEmail: jest.fn().mockResolvedValue(true),
            sendSMS: jest.fn().mockResolvedValue(true),
            sendWebhook: jest.fn().mockResolvedValue(true),
        } as unknown as NotificationRepository;

        commandBus = {
            execute: jest.fn(),
        } as unknown as CommandBus;

        processor = new ProcessWebsiteDownNotificationProcessor(
            queueRepository,
            notificationRepository,
            commandBus,
        );

        mockHost = {
            id: 'host-123',
        } as unknown as Host;

        mockWebsite = {
            id: 'website-123',
            host: mockHost,
            markWebsiteDownNotificationSent: jest.fn(),
        } as unknown as Website;

        mockNotification = {
            id: 'notification-123',
            correlationId: 'website-123',
            content: 'Test content',
            template: 'Test template',
            isPending: true,
            isProcessed: false,
            markAsSent: jest.fn(),
            markAsProcessed: jest.fn(),
            wipe: jest.fn(),
            get: jest.fn().mockImplementation((prop) => {
                if (prop === 'correlationId') return 'website-123';
                if (prop === 'content') return 'Test content';
                if (prop === 'template') return 'Test template';
                if (prop === 'isPending') return true;
                return undefined;
            }),
        } as unknown as Notification;

        mockConfig = {
            timezone: 'UTC',
            websiteId: 'website-123',
            websiteName: 'Test Website',
            websiteUrl: 'https://test.com',
            instanceId: 'instance-123',
            apiRetryAttempts: 3,
            websiteDowntimeThreshold: 300000,
            maxRestartAttempts: 3,
            hostStartupThreshold: 180000,
            host: {
                hostType: 'AWS' as any,
            },
            channels: [
                { type: NOTIFICATION_CHANNELS.EMAIL as any },
                { type: NOTIFICATION_CHANNELS.SMS as any },
                {
                    type: NOTIFICATION_CHANNELS.WEBHOOK as any,
                    webhooks: { endpoints: ['https://webhook.test.com'] },
                },
            ],
        };

        (aggregateStore as any).get.mockImplementation((id: string) => {
            if (id === 'notification-123') return mockNotification;
            if (id === 'website-123') return mockWebsite;
            return null;
        });
    });

    it('should return early if website is not found', async () => {
        (aggregateStore as any).get.mockImplementation((id: string) => {
            if (id === 'notification-123') return mockNotification;
            return null;
        });

        await processor.execute(
            'notification-123',
            mockConfig,
            'WEBSITE_DOWN_EVENT',
        );

        expect(mockNotification.markAsSent).not.toHaveBeenCalled();
        expect(mockNotification.wipe).not.toHaveBeenCalled();
        expect(commandBus.execute).not.toHaveBeenCalled();
    });

    it('should process website down notification and trigger restart command', async () => {
        await processor.execute(
            'notification-123',
            mockConfig,
            'WEBSITE_DOWN_EVENT',
        );

        expect(mockNotification.markAsSent).toHaveBeenCalled();
        expect(mockNotification.wipe).toHaveBeenCalled();
        expect(mockWebsite.markWebsiteDownNotificationSent).toHaveBeenCalled();
        expect(commandBus.execute).toHaveBeenCalledWith(
            new RestartHostCommand('host-123'),
        );
        expect(queueRepository.consume).toHaveBeenCalledWith(
            'notification-123',
            mockConfig,
            expect.any(Function),
        );
        expect(mockNotification.markAsProcessed).toHaveBeenCalled();
    });
});
