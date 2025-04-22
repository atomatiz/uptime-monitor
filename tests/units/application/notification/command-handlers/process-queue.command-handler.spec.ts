import { ProcessQueueCommandHandler } from '@application/notification/command-handlers/process-queue.command-handler';
import { ProcessQueueCommand } from '@domain/notification/commands/process-queue.command';
import { ProcessWebsiteQueueProcessor } from '@application/notification/processors/process-website-queue.processor';
import { ProcessHostQueueProcessor } from '@application/notification/processors/process-host-queue.processor';
import { DOMAINS } from '@common/constants';
import { WEBSITE_EVENT_NAMES } from '@common/domains/website';
import { HOST_EVENT_NAMES } from '@common/domains/host';

describe('ProcessQueueCommandHandler', () => {
    let handler: ProcessQueueCommandHandler;
    let processWebsiteQueueProcessor: ProcessWebsiteQueueProcessor;
    let processHostQueueProcessor: ProcessHostQueueProcessor;

    beforeEach(() => {
        processWebsiteQueueProcessor = {
            execute: jest.fn().mockResolvedValue(undefined),
        } as unknown as ProcessWebsiteQueueProcessor;

        processHostQueueProcessor = {
            execute: jest.fn().mockResolvedValue(undefined),
        } as unknown as ProcessHostQueueProcessor;

        handler = new ProcessQueueCommandHandler(
            processWebsiteQueueProcessor,
            processHostQueueProcessor,
        );
    });

    it('should execute ProcessWebsiteQueueProcessor for website domain type', async () => {
        const command = new ProcessQueueCommand(
            'notification-123',
            DOMAINS.WEBSITE,
            WEBSITE_EVENT_NAMES.WEBSITE_DOWN_EVENT,
        );

        await handler.execute(command);

        expect(processWebsiteQueueProcessor.execute).toHaveBeenCalledWith(
            'notification-123',
            WEBSITE_EVENT_NAMES.WEBSITE_DOWN_EVENT,
        );
        expect(processHostQueueProcessor.execute).not.toHaveBeenCalled();
    });

    it('should execute ProcessHostQueueProcessor for host domain type', async () => {
        const command = new ProcessQueueCommand(
            'notification-123',
            DOMAINS.HOST,
            HOST_EVENT_NAMES.HOST_RESTARTED_EVENT,
        );

        await handler.execute(command);

        expect(processHostQueueProcessor.execute).toHaveBeenCalledWith(
            'notification-123',
            HOST_EVENT_NAMES.HOST_RESTARTED_EVENT,
        );
        expect(processWebsiteQueueProcessor.execute).not.toHaveBeenCalled();
    });

    it('should do nothing for notification domain type', async () => {
        const command = new ProcessQueueCommand(
            'notification-123',
            DOMAINS.NOTIFICATION,
            'NOTIFICATION_SENT_EVENT',
        );

        await handler.execute(command);

        expect(processWebsiteQueueProcessor.execute).not.toHaveBeenCalled();
        expect(processHostQueueProcessor.execute).not.toHaveBeenCalled();
    });

    it('should throw error for unsupported domain type', async () => {
        const command = new ProcessQueueCommand(
            'notification-123',
            'UNSUPPORTED_DOMAIN' as any,
            'SOME_EVENT',
        );

        await expect(handler.execute(command)).rejects.toThrow(
            `Unsupported domain type for ID: notification-123`,
        );
    });
});
