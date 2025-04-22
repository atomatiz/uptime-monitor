import { Test } from '@nestjs/testing';
import { RestartHostCommandHandler } from '@application/host/command-handlers/restart-host.command-handler';
import { RestartHostUseCase } from '@application/host/use-cases/restart-host.use-case';
import { ConfigurationService } from '@core/configuration.service';
import { RestartHostCommand } from '@domain/host/commands/restart-host.command';
import { Host } from '@domain/host';
import { HOST_TYPES } from '@common/domains/host/constants/host.constants';
import aggregateStore from '@domain/aggregate-store';

jest.mock('@common/configs', () => ({
    generateWebsiteConfigs: jest.fn().mockReturnValue([
        {
            websiteId: '123',
            instanceId: 'i-1234567890abcdef0',
            name: 'Test Website',
            url: 'https://example.com',
        },
    ]),
}));
describe('RestartHostCommandHandler', () => {
    let handler: RestartHostCommandHandler;
    let restartHostUseCase: RestartHostUseCase;
    let configurationService: ConfigurationService;
    let host: Host;
    beforeEach(async () => {
        const mockRestartHostUseCase = {
            execute: jest.fn().mockResolvedValue(undefined),
        };
        const mockConfigurationService = {
            get: jest.fn(),
        };
        const moduleRef = await Test.createTestingModule({
            providers: [
                RestartHostCommandHandler,
                {
                    provide: RestartHostUseCase,
                    useValue: mockRestartHostUseCase,
                },
                {
                    provide: ConfigurationService,
                    useValue: mockConfigurationService,
                },
            ],
        }).compile();
        handler = moduleRef.get<RestartHostCommandHandler>(
            RestartHostCommandHandler,
        );
        restartHostUseCase =
            moduleRef.get<RestartHostUseCase>(RestartHostUseCase);
        configurationService =
            moduleRef.get<ConfigurationService>(ConfigurationService);
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
    it('should execute RestartHostUseCase with correct parameters', async () => {
        const command = new RestartHostCommand(host.id);
        await handler.execute(command);
        expect(restartHostUseCase.execute).toHaveBeenCalledWith(
            host.id,
            expect.objectContaining({
                websiteId: '123',
                instanceId: 'i-1234567890abcdef0',
                name: 'Test Website',
                url: 'https://example.com',
            }),
        );
    });
    it('should do nothing if host is not found in aggregate store', async () => {
        Object.keys(aggregateStore.getAll()).forEach((key) => {
            aggregateStore.delete(key);
        });
        const command = new RestartHostCommand('non-existent-id');
        await handler.execute(command);
        expect(restartHostUseCase.execute).not.toHaveBeenCalled();
    });
    it('should do nothing if config is not found for host', async () => {
        const differentHost = Host.create(
            HOST_TYPES.AWS,
            'different-instance-id',
            180000,
            2,
            'different-host-123',
        );
        aggregateStore.set(differentHost);
        const command = new RestartHostCommand(differentHost.id);
        await handler.execute(command);
        expect(restartHostUseCase.execute).not.toHaveBeenCalled();
    });
    it('should do nothing if aggregateId is not provided', async () => {
        const command = new RestartHostCommand(undefined as any);
        await handler.execute(command);
        expect(restartHostUseCase.execute).not.toHaveBeenCalled();
    });
});
