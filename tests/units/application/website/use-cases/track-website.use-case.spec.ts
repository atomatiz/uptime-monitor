import { Test } from '@nestjs/testing';
import { EventBus } from '@nestjs/cqrs';
import { TrackWebsiteUseCase } from '@application/website/use-cases/track-website.use-case';
import { WebsiteRepository } from '@application/website/repositories/website.repository';
import { Website } from '@domain/website';
import { Host } from '@domain/host';
import { HOST_TYPES } from '@common/domains/host/constants/host.constants';
import { WebsiteDownEvent } from '@domain/website/events/website-down.event';
import { WebsiteUpEvent } from '@domain/website/events/website-up.event';
import AggregateStore from '@domain/aggregate-store';
import { LoggingService } from '@core/logging.service';
import { WEBSITE_EVENT_NAMES } from '@common/domains/website';

jest.setTimeout(30000);
jest.mock('winston', () => {
    const mockFormat = {
        combine: jest.fn().mockReturnThis(),
        timestamp: jest.fn().mockReturnThis(),
        ms: jest.fn().mockReturnThis(),
        printf: jest.fn().mockReturnThis(),
        nestLike: jest.fn().mockReturnThis(),
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

describe('TrackWebsiteUseCase', () => {
    let trackWebsiteUseCase: TrackWebsiteUseCase;
    let websiteRepository: WebsiteRepository;
    let eventBus: EventBus;
    let website: Website;
    let host: Host;

    beforeEach(async () => {
        const mockWebsiteRepository = {
            trackWebsite: jest.fn(),
        };
        const mockEventBus = {
            publish: jest.fn().mockResolvedValue(undefined),
        };
        const mockLoggingService = new MockLoggingService();
        const moduleRef = await Test.createTestingModule({
            providers: [
                TrackWebsiteUseCase,
                {
                    provide: 'WEBSITE_REPOSITORY',
                    useValue: mockWebsiteRepository,
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
        trackWebsiteUseCase =
            moduleRef.get<TrackWebsiteUseCase>(TrackWebsiteUseCase);
        websiteRepository =
            moduleRef.get<WebsiteRepository>('WEBSITE_REPOSITORY');
        eventBus = moduleRef.get<EventBus>(EventBus);
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
        AggregateStore.set(website);
        jest.clearAllMocks();
    });

    afterEach(() => {
        Object.keys(AggregateStore.getAll()).forEach((key) => {
            AggregateStore.delete(key);
        });
    });

    it('should do nothing if website is not found in aggregate store', async () => {
        Object.keys(AggregateStore.getAll()).forEach((key) => {
            AggregateStore.delete(key);
        });
        await trackWebsiteUseCase.execute('non-existent-id');
        expect(websiteRepository.trackWebsite).not.toHaveBeenCalled();
        expect(eventBus.publish).not.toHaveBeenCalled();
    });

    it('should mark website as up if tracking is successful and website was down', async () => {
        website.markAsDown();
        website.markWebsiteDownNotificationSent();
        expect(website.websiteDownNotificationSent).toBe(true);
        const websiteUpEvent = new WebsiteUpEvent(website.id);
        const markAsUpSpy = jest.spyOn(website, 'markAsUp');
        const getDomainEventByIdSpy = jest
            .spyOn(website, 'getDomainEventById')
            .mockReturnValue(websiteUpEvent);
        const deleteDomainEventByIdSpy = jest.spyOn(
            website,
            'deleteDomainEventById',
        );

        jest.clearAllMocks();
        (websiteRepository.trackWebsite as jest.Mock).mockImplementation(
            (url, timeout) => {
                expect(url).toBe(website.url);
                expect(timeout).toBe(5000);
                return Promise.resolve(true);
            },
        );
        await trackWebsiteUseCase.execute(website.id);
        expect(websiteRepository.trackWebsite).toHaveBeenCalled();
        expect(markAsUpSpy).toHaveBeenCalled();
        expect(eventBus.publish).toHaveBeenCalledWith(websiteUpEvent);
        expect(deleteDomainEventByIdSpy).toHaveBeenCalledWith(website.id);
    });

    it('should reset all states if website is back online and notification was not sent', async () => {
        website.markAsDown();
        website.wipe();
        host.markAsRestarting('system');
        website.resetNotificationState();
        expect(website.websiteDownNotificationSent).toBe(false);
        (websiteRepository.trackWebsite as jest.Mock).mockImplementation(() => {
            return Promise.resolve(true);
        });
        await trackWebsiteUseCase.execute(website.id);
        expect(website.isOnline).toBe(true);
        expect(website.host.isRestarting).toBe(false);
        expect(website.host.isRestarted).toBe(false);
        expect(website.host.restartAttempts).toBe(0);
        expect(eventBus.publish).not.toHaveBeenCalled();
    });

    it('should mark website as down if tracking fails and website was online', async () => {
        expect(website.isOnline).toBe(true);
        (websiteRepository.trackWebsite as jest.Mock).mockResolvedValue(false);
        jest.spyOn(
            website,
            'hasReachedDowntimeThreshold',
            'get',
        ).mockReturnValue(true);
        website.resetNotificationState();
        await trackWebsiteUseCase.execute(website.id);
        expect(website.isOnline).toBe(false);
        expect(eventBus.publish).toHaveBeenCalled();
        expect(eventBus.publish).toHaveBeenCalledWith(
            expect.any(WebsiteDownEvent),
        );
    });

    it('should retry tracking up to trackingRetryAttempts times if tracking fails', async () => {
        (websiteRepository.trackWebsite as jest.Mock).mockImplementation(() => {
            website.markAsDown();
            return Promise.resolve(false);
        });
        website.props.isOnline = true;
        jest.useFakeTimers();
        const originalSetTimeout = global.setTimeout;
        global.setTimeout = function mockSetTimeout(
            callback: any,
            ms?: number,
        ) {
            if (typeof callback === 'function') callback();
            return 1 as any;
        } as typeof global.setTimeout;
        await trackWebsiteUseCase.execute(website.id);
        global.setTimeout = originalSetTimeout;
        jest.useRealTimers();
        expect(websiteRepository.trackWebsite).toHaveBeenCalledTimes(
            website.trackingRetryAttempts,
        );
        expect(website.isOnline).toBe(false);
    });

    it('should publish WebsiteDownEvent if downtime threshold is reached and notification not sent', async () => {
        website.markAsUp('system');
        expect(website.isOnline).toBe(true);
        website.resetNotificationState();
        jest.clearAllMocks();
        (websiteRepository.trackWebsite as jest.Mock).mockImplementation(() => {
            return Promise.resolve(false);
        });
        jest.spyOn(
            website,
            'hasReachedDowntimeThreshold',
            'get',
        ).mockReturnValue(true);
        jest.useFakeTimers();
        const originalSetTimeout = global.setTimeout;
        global.setTimeout = function mockSetTimeout(
            callback: any,
            ms?: number,
        ) {
            if (typeof callback === 'function') callback();
            return 1 as any;
        } as typeof global.setTimeout;
        await trackWebsiteUseCase.execute(website.id);
        global.setTimeout = originalSetTimeout;
        jest.useRealTimers();
        expect(eventBus.publish).toHaveBeenCalledWith(
            expect.objectContaining({
                eventName: WEBSITE_EVENT_NAMES.WEBSITE_DOWN_EVENT,
                aggregateId: website.id,
            }),
        );
    });

    it('should not publish event if host needs manual intervention', async () => {
        host.markAsNeedsManualIntervention();
        (websiteRepository.trackWebsite as jest.Mock).mockImplementation(() => {
            website.markAsDown();
            return Promise.resolve(false);
        });
        jest.spyOn(
            website,
            'hasReachedDowntimeThreshold',
            'get',
        ).mockReturnValue(true);
        jest.useFakeTimers();
        const originalSetTimeout = global.setTimeout;
        global.setTimeout = function mockSetTimeout(
            callback: any,
            ms?: number,
        ) {
            if (typeof callback === 'function') callback();
            return 1 as any;
        } as typeof global.setTimeout;
        await trackWebsiteUseCase.execute(website.id);
        global.setTimeout = originalSetTimeout;
        jest.useRealTimers();
        expect(eventBus.publish).not.toHaveBeenCalled();
    });

    it('should not publish event if website down notification was already sent', async () => {
        website.markAsDown();
        website.markWebsiteDownNotificationSent();
        website.wipe();
        (websiteRepository.trackWebsite as jest.Mock).mockResolvedValue(false);
        jest.spyOn(
            website,
            'hasReachedDowntimeThreshold',
            'get',
        ).mockReturnValue(true);
        await trackWebsiteUseCase.execute(website.id);
        expect(eventBus.publish).not.toHaveBeenCalled();
    });
});
