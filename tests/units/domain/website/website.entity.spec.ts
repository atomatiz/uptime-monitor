import { Website } from '@domain/website';
import { Host } from '@domain/host';
import { HOST_TYPES } from '@common/domains/host/constants/host.constants';
import { WebsiteDownEvent } from '@domain/website/events/website-down.event';
import { WebsiteUpEvent } from '@domain/website/events/website-up.event';

describe('Website Entity', () => {
    let host: Host;

    beforeEach(() => {
        host = Host.create(
            HOST_TYPES.AWS,
            'i-1234567890abcdef0',
            180000,
            2,
            'host-123',
        );
    });

    describe('create', () => {
        it('should create a website with valid parameters', () => {
            const website = Website.create(
                'https://example.com',
                'Example Website',
                host,
                2,
                60000,
                'website-123',
            );
            expect(website).toBeDefined();
            expect(website.id).toBe('website-123');
            expect(website.url).toBe('https://example.com');
            expect(website.name).toBe('Example Website');
            expect(website.host).toBe(host);
            expect(website.isOnline).toBe(true);
            expect(website.downtimeThreshold).toBe(60000);
            expect(website.trackingRetryAttempts).toBe(2);
            expect(website.totalDowntime).toBe(0);
        });

        it('should throw an error when URL is empty', () => {
            expect(() => {
                Website.create('', 'Example Website', host, 2, 60000);
            }).toThrow('Website URL is required');
        });

        it('should throw an error when name is empty', () => {
            expect(() => {
                Website.create('https://example.com', '', host, 2, 60000);
            }).toThrow('Website name is required');
        });
    });

    describe('markAsDown', () => {
        it('should mark website as down and register domain event', () => {
            const website = Website.create(
                'https://example.com',
                'Example Website',
                host,
                2,
                60000,
            );
            website.markAsDown('system');
            expect(website.isOnline).toBe(false);
            expect(website.downtimeStartTimestamp).toBeDefined();
            expect(website.lastDowntime).toBeDefined();
            expect(website.totalDowntime).toBe(0);
            const domainEvents = website.domainEvents;
            expect(domainEvents.length).toBe(1);
            expect(domainEvents[0]).toBeInstanceOf(WebsiteDownEvent);
            expect(domainEvents[0].aggregateId).toBe(website.id);
        });

        it('should not register domain event if website is already down', () => {
            const website = Website.create(
                'https://example.com',
                'Example Website',
                host,
                2,
                60000,
            );
            website.markAsDown('system');
            const initialDomainEvents = website.domainEvents.length;
            website.markAsDown('system');
            expect(website.domainEvents.length).toBe(initialDomainEvents);
        });

        it('should not register domain event if website down notification was already sent', () => {
            const website = Website.create(
                'https://example.com',
                'Example Website',
                host,
                2,
                60000,
            );
            website.markWebsiteDownNotificationSent('system');
            website.wipe();
            website.markAsDown('system');
            expect(website.domainEvents.length).toBe(0);
        });
    });

    describe('markAsUp', () => {
        it('should mark website as up and register domain event', () => {
            const website = Website.create(
                'https://example.com',
                'Example Website',
                host,
                2,
                60000,
            );
            website.props.isOnline = false;
            website.props.downtimeStartTimestamp = new Date();
            jest.useFakeTimers();
            const downStartTime = new Date();
            jest.setSystemTime(downStartTime.getTime() + 5000);
            website.markAsUp('system');
            expect(website.isOnline).toBe(true);
            expect(website.lastTrackedAt).toBeDefined();
            expect(website.downtimeStartTimestamp).toBeUndefined();
            expect(website.totalDowntime).toBeGreaterThan(0);
            const domainEvents = website.domainEvents;
            expect(domainEvents.length).toBe(1);
            expect(domainEvents[0]).toBeInstanceOf(WebsiteUpEvent);
            expect(domainEvents[0].aggregateId).toBe(website.id);
            jest.useRealTimers();
        });

        it('should not register domain event if website is already up', () => {
            const website = Website.create(
                'https://example.com',
                'Example Website',
                host,
                2,
                60000,
            );
            website.wipe();
            website.markAsUp('system');
            expect(website.domainEvents.length).toBe(0);
        });
    });

    describe('hasReachedDowntimeThreshold', () => {
        it('should return true when downtime exceeds threshold', () => {
            const website = Website.create(
                'https://example.com',
                'Example Website',
                host,
                2,
                5000,
            );
            website.markAsDown('system');
            jest.useFakeTimers();
            const downStartTime = new Date();
            jest.setSystemTime(downStartTime.getTime() + 6000);
            expect(website.hasReachedDowntimeThreshold).toBe(true);
            jest.useRealTimers();
        });

        it('should return false when downtime does not exceed threshold', () => {
            const website = Website.create(
                'https://example.com',
                'Example Website',
                host,
                2,
                10000,
            );
            website.markAsDown('system');
            jest.useFakeTimers();
            const downStartTime = new Date();
            jest.setSystemTime(downStartTime.getTime() + 5000);
            expect(website.hasReachedDowntimeThreshold).toBe(false);
            jest.useRealTimers();
        });

        it('should return false when website is online', () => {
            const website = Website.create(
                'https://example.com',
                'Example Website',
                host,
                2,
                5000,
            );
            expect(website.hasReachedDowntimeThreshold).toBe(false);
        });
    });

    describe('notification state management', () => {
        it('should mark website down notification as sent', () => {
            const website = Website.create(
                'https://example.com',
                'Example Website',
                host,
                2,
                60000,
            );
            website.markWebsiteDownNotificationSent('system');
            expect(website.websiteDownNotificationSent).toBe(true);
        });

        it('should mark website up notification as sent', () => {
            const website = Website.create(
                'https://example.com',
                'Example Website',
                host,
                2,
                60000,
            );
            website.markWebsiteUpNotificationSent('system');
            expect(website.websiteUpNotificationSent).toBe(true);
        });

        it('should reset notification state', () => {
            const website = Website.create(
                'https://example.com',
                'Example Website',
                host,
                2,
                60000,
            );
            website.markWebsiteDownNotificationSent('system');
            website.markWebsiteUpNotificationSent('system');
            expect(website.websiteDownNotificationSent).toBe(true);
            expect(website.websiteUpNotificationSent).toBe(true);
            website.resetNotificationState('system');
            expect(website.websiteDownNotificationSent).toBe(false);
            expect(website.websiteUpNotificationSent).toBe(false);
        });
    });

    describe('resetState', () => {
        it('should reset all website state properties', () => {
            const website = Website.create(
                'https://example.com',
                'Example Website',
                host,
                2,
                60000,
            );
            website.markAsDown('system');
            website.markWebsiteDownNotificationSent('system');
            website.resetState('system');
            expect(website.isOnline).toBe(true);
            expect(website.downtimeStartTimestamp).toBeUndefined();
            expect(website.totalDowntime).toBe(0);
            expect(website.lastTrackedAt).toBeDefined();
            expect(website.websiteDownNotificationSent).toBe(false);
            expect(website.websiteUpNotificationSent).toBe(false);
        });
    });
});
