import { ProcessHostQueueProcessor } from '@application/notification/processors/process-host-queue.processor';
import { ProcessHostRestartedNotificationProcessor } from '@application/host/processors/process-host-restarted-notification.processor';
import { ProcessHostManualInterventionNotificationProcessor } from '@application/host/processors/process-host-manual-intervention.processor';
import { ConfigurationService } from '@core/configuration.service';
import { Notification } from '@domain/notification/notification.entity';
import { Host } from '@domain/host/host.entity';
import { HOST_EVENT_NAMES } from '@common/domains/host';
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

describe('ProcessHostQueueProcessor', () => {
    let processor: ProcessHostQueueProcessor;
    let processHostRestartedNotificationProcessor: ProcessHostRestartedNotificationProcessor;
    let processHostManualInterventionNotificationProcessor: ProcessHostManualInterventionNotificationProcessor;
    let configService: ConfigurationService;
    let mockNotification: Notification;
    let mockHost: Host;

    beforeEach(() => {
        processHostRestartedNotificationProcessor = {
            execute: jest.fn().mockResolvedValue(undefined),
        } as unknown as ProcessHostRestartedNotificationProcessor;

        processHostManualInterventionNotificationProcessor = {
            execute: jest.fn().mockResolvedValue(undefined),
        } as unknown as ProcessHostManualInterventionNotificationProcessor;

        configService = {} as ConfigurationService;

        processor = new ProcessHostQueueProcessor(
            processHostRestartedNotificationProcessor,
            processHostManualInterventionNotificationProcessor,
            configService,
        );

        mockNotification = {
            id: 'notification-123',
            correlationId: 'host-123',
            isPending: true,
            get: jest.fn().mockImplementation((prop) => {
                if (prop === 'isPending') return true;
                return undefined;
            }),
        } as unknown as Notification;

        mockHost = {
            id: 'host-123',
        } as unknown as Host;

        (aggregateStore as any).get.mockImplementation((id: string) => {
            if (id === 'notification-123') return mockNotification;
            if (id === 'host-123') return mockHost;
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
                HOST_EVENT_NAMES.HOST_RESTARTED_EVENT,
            ),
        ).rejects.toThrow('No notification found with ID: notification-123');
    });

    it('should do nothing if notification is not pending', async () => {
        const nonPendingNotification = {
            id: 'notification-123',
            correlationId: 'host-123',
            isPending: false,
            get: jest.fn().mockImplementation((prop) => {
                if (prop === 'isPending') return false;
                return undefined;
            }),
        } as unknown as Notification;

        (aggregateStore as any).get.mockImplementation((id: string) => {
            if (id === 'notification-123') return nonPendingNotification;
            if (id === 'host-123') return mockHost;
            return null;
        });

        await processor.execute(
            'notification-123',
            HOST_EVENT_NAMES.HOST_RESTARTED_EVENT,
        );

        expect(
            processHostRestartedNotificationProcessor.execute,
        ).not.toHaveBeenCalled();
        expect(
            processHostManualInterventionNotificationProcessor.execute,
        ).not.toHaveBeenCalled();
    });

    it('should process host restarted notification', async () => {
        await processor.execute(
            'notification-123',
            HOST_EVENT_NAMES.HOST_RESTARTED_EVENT,
        );

        expect(
            processHostRestartedNotificationProcessor.execute,
        ).toHaveBeenCalledWith(
            'notification-123',
            expect.objectContaining({
                websiteId: '123',
                url: 'https://example.com',
                name: 'Example Website',
            }),
            HOST_EVENT_NAMES.HOST_RESTARTED_EVENT,
        );
        expect(
            processHostManualInterventionNotificationProcessor.execute,
        ).not.toHaveBeenCalled();
    });

    it('should process host manual intervention notification', async () => {
        await processor.execute(
            'notification-123',
            HOST_EVENT_NAMES.HOST_MANUAL_INTERVENTION_EVENT,
        );

        expect(
            processHostManualInterventionNotificationProcessor.execute,
        ).toHaveBeenCalledWith(
            'notification-123',
            expect.objectContaining({
                websiteId: '123',
                url: 'https://example.com',
                name: 'Example Website',
            }),
            HOST_EVENT_NAMES.HOST_MANUAL_INTERVENTION_EVENT,
        );
        expect(
            processHostRestartedNotificationProcessor.execute,
        ).not.toHaveBeenCalled();
    });

    it('should throw error for unsupported event', async () => {
        await expect(
            processor.execute('notification-123', 'UNSUPPORTED_EVENT'),
        ).rejects.toThrow('Unsupported event for ID: notification-123');
    });
});
