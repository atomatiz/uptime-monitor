import { Test } from '@nestjs/testing';
import { EventBus } from '@nestjs/cqrs';
import { RestartHostUseCase } from '@application/host/use-cases/restart-host.use-case';
import { HostRepository } from '@application/host/repositories/host.repository';
import { Host } from '@domain/host';
import { HOST_TYPES } from '@common/domains/host/constants/host.constants';
import { Website } from '@domain/website';
import { HostManualInterventionEvent } from '@domain/host/events/host-manual-intervention.event';
import { HostRestartedEvent } from '@domain/host/events/host-restarted.event';
import { ID_PREFIXES } from '@common/constants';
import AggregateStore from '@domain/aggregate-store';
import { LoggingService } from '@core/logging.service';

jest.setTimeout(30000);
jest.mock('winston', () => {
    const mockFormat = {
        combine: jest.fn().mockReturnThis(),
        timestamp: jest.fn().mockReturnThis(),
        ms: jest.fn().mockReturnThis(),
        printf: jest.fn().mockReturnThis(),
    };
    const mockLogger = {
        log: jest.fn(),
        info: jest.fn(),
        error: jest.fn(),
        warn: jest.fn(),
        debug: jest.fn(),
    };
    return {
        format: mockFormat,
        createLogger: jest.fn().mockReturnValue(mockLogger),
        transports: {
            Console: jest.fn(),
            File: jest.fn(),
        },
    };
});
class MockLoggingService {
    log(message: any, meta?: any) {}
    info(message: any, meta?: any) {}
    warn(message: any, meta?: any) {}
    error(message: any, meta?: any) {}
    debug(message: any, meta?: any) {}
}
describe('RestartHostUseCase', () => {
    let restartHostUseCase: RestartHostUseCase;
    let hostRepository: HostRepository;
    let eventBus: EventBus;
    let host: Host;
    let website: Website;
    let config: any;
    beforeEach(async () => {
        const mockHostRepository = {
            isRestarting: jest.fn(),
            restartHost: jest.fn(),
        };
        const mockEventBus = {
            publish: jest.fn().mockResolvedValue(undefined),
        };
        const mockLoggingService = new MockLoggingService();
        const moduleRef = await Test.createTestingModule({
            providers: [
                RestartHostUseCase,
                {
                    provide: 'HOST_REPOSITORY',
                    useValue: mockHostRepository,
                },
                {
                    provide: EventBus,
                    useValue: mockEventBus,
                },
                {
                    provide: LoggingService,
                    useValue: mockLoggingService,
                },
            ],
        }).compile();
        restartHostUseCase =
            moduleRef.get<RestartHostUseCase>(RestartHostUseCase);
        hostRepository = moduleRef.get<HostRepository>('HOST_REPOSITORY');
        eventBus = moduleRef.get<EventBus>(EventBus);
        const hostId = `${ID_PREFIXES.HOST}123`;
        host = Host.create(
            HOST_TYPES.AWS,
            'i-1234567890abcdef0',
            1000,
            2,
            hostId,
        );
        const websiteId = `${ID_PREFIXES.WEBSITE}123`;
        website = Website.create(
            'https://example.com',
            'Example Website',
            host,
            2,
            60000,
            websiteId,
        );
        AggregateStore.set(host);
        AggregateStore.set(website);
        config = {
            aws: {
                region: 'us-east-1',
                accessKeyId: 'test-key',
                secretAccessKey: 'test-secret',
            },
        };
        jest.clearAllMocks();
        jest.useFakeTimers();
    });
    afterEach(() => {
        Object.keys(AggregateStore.getAll()).forEach((key) => {
            AggregateStore.delete(key);
        });
        jest.useRealTimers();
    });
    it('should do nothing if host or website is not found in aggregate store', async () => {
        Object.keys(AggregateStore.getAll()).forEach((key) => {
            AggregateStore.delete(key);
        });
        await restartHostUseCase.execute('non-existent-id', config);
        expect(hostRepository.isRestarting).not.toHaveBeenCalled();
        expect(hostRepository.restartHost).not.toHaveBeenCalled();
        expect(eventBus.publish).not.toHaveBeenCalled();
    });
    it('should do nothing if host needs manual intervention', async () => {
        host.markAsNeedsManualIntervention();
        await restartHostUseCase.execute(host.id, config);
        expect(hostRepository.isRestarting).not.toHaveBeenCalled();
        expect(hostRepository.restartHost).not.toHaveBeenCalled();
        expect(eventBus.publish).not.toHaveBeenCalled();
    });
    it('should do nothing if host has reached max restart attempts', async () => {
        jest.spyOn(host, 'hasReachedMaxRestartAttempts', 'get').mockReturnValue(
            true,
        );
        expect(host.hasReachedMaxRestartAttempts).toBe(true);
        await restartHostUseCase.execute(host.id, config);
        expect(hostRepository.isRestarting).not.toHaveBeenCalled();
        expect(hostRepository.restartHost).not.toHaveBeenCalled();
        expect(eventBus.publish).not.toHaveBeenCalled();
    });
    it('should wait for threshold if host is already restarting', async () => {
        (hostRepository.isRestarting as jest.Mock).mockResolvedValue(true);
        await restartHostUseCase.execute(host.id, config);
        expect(hostRepository.isRestarting).toHaveBeenCalledWith(
            host.instanceId,
            config,
        );
        expect(hostRepository.restartHost).not.toHaveBeenCalled();
    });
    it('should mark host as restarting and attempt to restart it', async () => {
        (hostRepository.isRestarting as jest.Mock).mockResolvedValue(false);
        (hostRepository.restartHost as jest.Mock).mockImplementation(() => {
            host.markAsRestarting('system');
            return Promise.resolve(true);
        });
        host.resetState();
        expect(host.isRestarting).toBe(false);
        jest.spyOn(host, 'isRestarting', 'get').mockReturnValue(true);
        await restartHostUseCase.execute(host.id, config);
        expect(hostRepository.isRestarting).toHaveBeenCalledWith(
            host.instanceId,
            config,
        );
        expect(hostRepository.restartHost).toHaveBeenCalledWith(
            host.instanceId,
            config,
        );
        expect(host.isRestarting).toBe(true);
    });
    it('should publish HostRestartedEvent if restart is successful and it is the first attempt', async () => {
        (hostRepository.isRestarting as jest.Mock).mockResolvedValue(false);
        (hostRepository.restartHost as jest.Mock).mockImplementation(() => {
            host.markAsRestarting('system');
            host.markAsRestarted('system');
            return Promise.resolve(true);
        });
        await restartHostUseCase.execute(host.id, config);
        expect(eventBus.publish).toHaveBeenCalledWith(
            expect.any(HostRestartedEvent),
        );
    });
    it('should mark host as needing manual intervention if all restart attempts fail', async () => {
        website.markAsDown();
        jest.spyOn(
            host,
            'manualInterventionNotificationSent',
            'get',
        ).mockReturnValue(false);
        const manualInterventionEvent = new HostManualInterventionEvent(
            host.id,
        );
        jest.spyOn(host, 'getDomainEventById').mockReturnValue(
            manualInterventionEvent,
        );
        const markAsNeedsManualInterventionSpy = jest.spyOn(
            host,
            'markAsNeedsManualIntervention',
        );
        const deleteDomainEventByIdSpy = jest.spyOn(
            host,
            'deleteDomainEventById',
        );
        await (restartHostUseCase as any).checkManualIntervention(
            host,
            website,
        );
        expect(markAsNeedsManualInterventionSpy).toHaveBeenCalled();
        expect(eventBus.publish).toHaveBeenCalledWith(manualInterventionEvent);
        expect(deleteDomainEventByIdSpy).toHaveBeenCalledWith(host.id);
    });
    it('should not publish manual intervention event if notification was already sent', async () => {
        (hostRepository.isRestarting as jest.Mock).mockResolvedValue(false);
        (hostRepository.restartHost as jest.Mock).mockResolvedValue(false);
        website.markAsDown();
        host.markAsNeedsManualIntervention();
        host.markAsManualInterventionNotificationSent('system');
        const executePromise = restartHostUseCase.execute(host.id, config);
        jest.runAllTimers();
        await executePromise;
        expect(host.needsManualIntervention).toBe(true);
        expect(eventBus.publish).not.toHaveBeenCalled();
    });
    it('should stop restart attempts if website comes back online', async () => {
        (hostRepository.isRestarting as jest.Mock).mockResolvedValue(false);
        (hostRepository.restartHost as jest.Mock).mockResolvedValue(true);
        const executePromise = restartHostUseCase.execute(host.id, config);
        website.markAsUp();
        jest.runAllTimers();
        await executePromise;
        expect(host.isRestarted).toBe(true);
    });
});
