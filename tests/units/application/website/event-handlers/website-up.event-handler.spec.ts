import { Test } from '@nestjs/testing';
import { CommandBus } from '@nestjs/cqrs';
import { WebsiteUpEventHandler } from '@application/website/event-handlers/website-up.event-handler';
import { WebsiteUpEvent } from '@domain/website/events/website-up.event';
import { Website } from '@domain/website';
import { Host } from '@domain/host';
import { HOST_TYPES } from '@common/domains/host/constants/host.constants';
import { SendNotificationCommand } from '@domain/notification/commands/send-notification.command';
import { DOMAINS } from '@common/constants';
import { WEBSITE_EVENT_NAMES } from '@common/domains/website';
import aggregateStore from '@domain/aggregate-store';

describe('WebsiteUpEventHandler', () => {
    let handler: WebsiteUpEventHandler;
    let commandBus: CommandBus;
    let website: Website;
    let host: Host;

    beforeEach(async () => {
        const mockCommandBus = {
            execute: jest.fn().mockResolvedValue(undefined),
        };
        const moduleRef = await Test.createTestingModule({
            providers: [
                WebsiteUpEventHandler,
                {
                    provide: CommandBus,
                    useValue: mockCommandBus,
                },
            ],
        }).compile();
        handler = moduleRef.get<WebsiteUpEventHandler>(WebsiteUpEventHandler);
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

    it('should execute SendNotificationCommand when handling WebsiteUpEvent', async () => {
        const event = new WebsiteUpEvent(website.id);
        await handler.handle(event);
        expect(commandBus.execute).toHaveBeenCalledWith(
            new SendNotificationCommand(
                website.id,
                DOMAINS.WEBSITE,
                WEBSITE_EVENT_NAMES.WEBSITE_UP_EVENT,
            ),
        );
    });

    it('should throw error if website is not found in aggregate store', async () => {
        Object.keys(aggregateStore.getAll()).forEach((key) => {
            aggregateStore.delete(key);
        });
        const event = new WebsiteUpEvent('non-existent-id');
        await expect(handler.handle(event)).rejects.toThrow(
            'No website found with ID: non-existent-id',
        );
        expect(commandBus.execute).not.toHaveBeenCalled();
    });
});
