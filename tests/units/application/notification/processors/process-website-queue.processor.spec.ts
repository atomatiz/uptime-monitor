import { ProcessWebsiteQueueProcessor } from '@application/notification/processors/process-website-queue.processor';
import { ProcessWebsiteDownNotificationProcessor } from '@application/website/processors/process-website-down-notification.processor';
import { ProcessWebsiteUpNotificationProcessor } from '@application/website/processors/process-website-up-notification.processor';
import { ConfigurationService } from '@core/configuration.service';
import { Notification } from '@domain/notification';
import { Website } from '@domain/website';
import { WEBSITE_EVENT_NAMES } from '@common/domains/website';
import aggregateStore from '@domain/aggregate-store';

jest.mock('@domain/aggregate-store', () => ({
    __esModule: true,
    default: {
        get: jest.fn(),
    },
}));

jest.mock('@common/configs', () => ({
    generateWebsiteConfigs: jest.fn().mockReturnValue([
        {
            websiteId: '123',
            url: 'https://example.com',
            name: 'Example Website',
        },
    ]),
}));

describe('ProcessWebsiteQueueProcessor', () => {
    let processor: ProcessWebsiteQueueProcessor;
    let processWebsiteDownNotificationProcessor: ProcessWebsiteDownNotificationProcessor;
    let processWebsiteUpNotificationProcessor: ProcessWebsiteUpNotificationProcessor;
    let configService: ConfigurationService;
    let mockNotification: Notification;
    let mockWebsite: Website;

    beforeEach(() => {
        processWebsiteDownNotificationProcessor = {
            execute: jest.fn().mockResolvedValue(undefined),
        } as unknown as ProcessWebsiteDownNotificationProcessor;

        processWebsiteUpNotificationProcessor = {
            execute: jest.fn().mockResolvedValue(undefined),
        } as unknown as ProcessWebsiteUpNotificationProcessor;

        configService = {} as ConfigurationService;

        processor = new ProcessWebsiteQueueProcessor(
            processWebsiteDownNotificationProcessor,
            processWebsiteUpNotificationProcessor,
            configService,
        );

        mockNotification = {
            id: 'notification-123',
            correlationId: 'website-123',
            isPending: true,
            get: jest.fn().mockImplementation((prop) => {
                if (prop === 'isPending') return true;
                return undefined;
            }),
        } as unknown as Notification;

        mockWebsite = {
            id: 'website-123',
        } as unknown as Website;

        (aggregateStore as any).get.mockImplementation((id: string) => {
            if (id === 'notification-123') return mockNotification;
            if (id === 'website-123') return mockWebsite;
            return null;
        });
    });

    afterEach(() => {
        jest.clearAllMocks();
    });

    it('should throw error if notification is not found', async () => {
        (aggregateStore as any).get.mockReturnValue(null);

        await expect(
            processor.execute(
                'notification-123',
                WEBSITE_EVENT_NAMES.WEBSITE_DOWN_EVENT,
            ),
        ).rejects.toThrow('No notification found with ID: notification-123');
    });

    it('should do nothing if notification is not pending', async () => {
        const nonPendingNotification = {
            id: 'notification-123',
            correlationId: 'website-123',
            isPending: false,
            get: jest.fn().mockImplementation((prop) => {
                if (prop === 'isPending') return false;
                return undefined;
            }),
        } as unknown as Notification;

        (aggregateStore as any).get.mockImplementation((id: string) => {
            if (id === 'notification-123') return nonPendingNotification;
            if (id === 'website-123') return mockWebsite;
            return null;
        });

        await processor.execute(
            'notification-123',
            WEBSITE_EVENT_NAMES.WEBSITE_DOWN_EVENT,
        );

        expect(
            processWebsiteDownNotificationProcessor.execute,
        ).not.toHaveBeenCalled();
        expect(
            processWebsiteUpNotificationProcessor.execute,
        ).not.toHaveBeenCalled();
    });

    it('should process website down notification', async () => {
        await processor.execute(
            'notification-123',
            WEBSITE_EVENT_NAMES.WEBSITE_DOWN_EVENT,
        );

        expect(
            processWebsiteDownNotificationProcessor.execute,
        ).toHaveBeenCalledWith(
            'notification-123',
            expect.objectContaining({
                websiteId: '123',
                url: 'https://example.com',
                name: 'Example Website',
            }),
            WEBSITE_EVENT_NAMES.WEBSITE_DOWN_EVENT,
        );
        expect(
            processWebsiteUpNotificationProcessor.execute,
        ).not.toHaveBeenCalled();
    });

    it('should process website up notification', async () => {
        await processor.execute(
            'notification-123',
            WEBSITE_EVENT_NAMES.WEBSITE_UP_EVENT,
        );

        expect(
            processWebsiteUpNotificationProcessor.execute,
        ).toHaveBeenCalledWith(
            'notification-123',
            expect.objectContaining({
                websiteId: '123',
                url: 'https://example.com',
                name: 'Example Website',
            }),
            WEBSITE_EVENT_NAMES.WEBSITE_UP_EVENT,
        );
        expect(
            processWebsiteDownNotificationProcessor.execute,
        ).not.toHaveBeenCalled();
    });

    it('should throw error for unsupported event', async () => {
        await expect(
            processor.execute('notification-123', 'UNSUPPORTED_EVENT'),
        ).rejects.toThrow('Unsupported event for ID: notification-123');
    });
});
