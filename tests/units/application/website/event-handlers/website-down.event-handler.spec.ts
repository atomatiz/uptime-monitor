import { Test } from '@nestjs/testing';
import { CommandBus } from '@nestjs/cqrs';
import { WebsiteDownEventHandler } from '@application/website/event-handlers/website-down.event-handler';
import { WebsiteDownEvent } from '@domain/website/events/website-down.event';
import { Website } from '@domain/website';
import { Host } from '@domain/host';
import { HOST_TYPES } from '@common/domains/host/constants/host.constants';
import { SendNotificationCommand } from '@domain/notification/commands/send-notification.command';
import { DOMAINS } from '@common/constants';
import { WEBSITE_EVENT_NAMES } from '@common/domains/website';
import aggregateStore from '@domain/aggregate-store';

describe('WebsiteDownEventHandler', () => {
    let handler: WebsiteDownEventHandler;
    let commandBus: CommandBus;
    let website: Website;
    let host: Host;

    beforeEach(async () => {
        const mockCommandBus = {
            execute: jest.fn().mockResolvedValue(undefined),
        };
        const moduleRef = await Test.createTestingModule({
            providers: [
                WebsiteDownEventHandler,
                {
                    provide: CommandBus,
                    useValue: mockCommandBus,
                },
            ],
        }).compile();
        handler = moduleRef.get<WebsiteDownEventHandler>(
            WebsiteDownEventHandler,
        );
        commandBus = moduleRef.get<CommandBus>(CommandBus);
        host = Host.create(
            HOST_TYPES.AWS,
            'i-1234567890abcdef0',
            180000,
            2,
            'host-123',
        );
        website = Website.create(
            'https://example.com',
            'Example Website',
            host,
            2,
            60000,
            'website-123',
        );
        aggregateStore.set(website);
        jest.clearAllMocks();
    });

    afterEach(() => {
        Object.keys(aggregateStore.getAll()).forEach((key) => {
            aggregateStore.delete(key);
        });
    });

    it('should execute SendNotificationCommand when handling WebsiteDownEvent', async () => {
        const event = new WebsiteDownEvent(website.id);
        await handler.handle(event);
        expect(commandBus.execute).toHaveBeenCalledWith(
            new SendNotificationCommand(
                website.id,
                DOMAINS.WEBSITE,
                WEBSITE_EVENT_NAMES.WEBSITE_DOWN_EVENT,
            ),
        );
    });

    it('should throw error if website is not found in aggregate store', async () => {
        Object.keys(aggregateStore.getAll()).forEach((key) => {
            aggregateStore.delete(key);
        });
        const event = new WebsiteDownEvent('non-existent-id');
        await expect(handler.handle(event)).rejects.toThrow(
            'No website found with ID: non-existent-id',
        );
        expect(commandBus.execute).not.toHaveBeenCalled();
    });
});
