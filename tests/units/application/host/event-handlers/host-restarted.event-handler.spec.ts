import { Test } from '@nestjs/testing';
import { CommandBus } from '@nestjs/cqrs';
import { HostRestartedEventHandler } from '@application/host/event-handlers/host-restarted.event-handler';
import { HostRestartedEvent } from '@domain/host/events/host-restarted.event';
import { Host } from '@domain/host';
import { HOST_TYPES } from '@common/domains/host/constants/host.constants';
import { SendNotificationCommand } from '@domain/notification/commands/send-notification.command';
import { DOMAINS } from '@common/constants';
import { HOST_EVENT_NAMES } from '@common/domains/host';
import aggregateStore from '@domain/aggregate-store';

describe('HostRestartedEventHandler', () => {
    let handler: HostRestartedEventHandler;
    let commandBus: CommandBus;
    let host: Host;
    beforeEach(async () => {
        const mockCommandBus = {
            execute: jest.fn().mockResolvedValue(undefined),
        };
        const moduleRef = await Test.createTestingModule({
            providers: [
                HostRestartedEventHandler,
                {
                    provide: CommandBus,
                    useValue: mockCommandBus,
                },
            ],
        }).compile();
        handler = moduleRef.get<HostRestartedEventHandler>(
            HostRestartedEventHandler,
        );
        commandBus = moduleRef.get<CommandBus>(CommandBus);
        host = Host.create(
            HOST_TYPES.AWS,
            'i-1234567890abcdef0',
            180000,
            2,
            'host-123',
        );
        aggregateStore.set(host);
        jest.clearAllMocks();
    });
    afterEach(() => {
        Object.keys(aggregateStore.getAll()).forEach((key) => {
            aggregateStore.delete(key);
        });
    });
    it('should execute SendNotificationCommand when handling HostRestartedEvent', async () => {
        const event = new HostRestartedEvent(host.id);
        await handler.handle(event);
        expect(commandBus.execute).toHaveBeenCalledWith(
            new SendNotificationCommand(
                host.id,
                DOMAINS.HOST,
                HOST_EVENT_NAMES.HOST_RESTARTED_EVENT,
            ),
        );
    });
    it('should throw error if host is not found in aggregate store', async () => {
        Object.keys(aggregateStore.getAll()).forEach((key) => {
            aggregateStore.delete(key);
        });
        const event = new HostRestartedEvent('non-existent-id');
        await expect(handler.handle(event)).rejects.toThrow(
            'No host found with ID: non-existent-id',
        );
        expect(commandBus.execute).not.toHaveBeenCalled();
    });
});
