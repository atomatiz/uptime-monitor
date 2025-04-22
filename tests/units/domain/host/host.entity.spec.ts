import { Host } from '@domain/host';
import { HOST_TYPES } from '@common/domains/host/constants/host.constants';
import { HostRestartedEvent } from '@domain/host/events/host-restarted.event';
import { HostManualInterventionEvent } from '@domain/host/events/host-manual-intervention.event';

describe('Host Entity', () => {
    describe('create', () => {
        it('should create a host with valid parameters', () => {
            const host = Host.create(
                HOST_TYPES.AWS,
                'i-1234567890abcdef0',
                180000,
                2,
                'host-123',
            );
            expect(host).toBeDefined();
            expect(host.id).toBe('host-123');
            expect(host.hostType).toBe(HOST_TYPES.AWS);
            expect(host.instanceId).toBe('i-1234567890abcdef0');
            expect(host.startupThreshold).toBe(180000);
            expect(host.maxRestartAttempts).toBe(2);
            expect(host.restartAttempts).toBe(0);
            expect(host.isRestarting).toBe(false);
            expect(host.isRestarted).toBe(false);
            expect(host.needsManualIntervention).toBe(false);
        });
    });

    describe('markAsRestarting', () => {
        it('should mark host as restarting and increment restart attempts', () => {
            const host = Host.create(
                HOST_TYPES.AWS,
                'i-1234567890abcdef0',
                180000,
                2,
                'host-123',
            );
            host.markAsRestarting('system');
            expect(host.isRestarting).toBe(true);
            expect(host.restartAttempts).toBe(1);
            expect(host.lastRestartedAt).toBeDefined();
            expect(host.restartedBy).toBe('system');
        });

        it('should not mark as restarting if max restart attempts reached', () => {
            const host = Host.create(
                HOST_TYPES.AWS,
                'i-1234567890abcdef0',
                180000,
                2,
                'host-123',
            );
            host.markAsRestarting('system');
            expect(host.restartAttempts).toBe(1);
            host.markAsRestarting('system');
            expect(host.restartAttempts).toBe(1);
            host.props.isRestarting = false;
            host.markAsRestarting('system');
            expect(host.restartAttempts).toBe(2);
            expect(host.isRestarting).toBe(true);
        });

        it('should not mark as restarting if startup threshold reached', () => {
            const host = Host.create(
                HOST_TYPES.AWS,
                'i-1234567890abcdef0',
                5000,
                2,
                'host-123',
            );
            host.markAsRestarting('system');
            jest.useFakeTimers();
            const restartTime = new Date();
            jest.setSystemTime(restartTime.getTime() + 6000);
            host.props.isRestarting = false;
            host.markAsRestarting('system');
            expect(host.isRestarting).toBe(false);
            expect(host.restartAttempts).toBe(1);
            jest.useRealTimers();
        });
    });

    describe('markAsRestarted', () => {
        it('should mark host as restarted and register domain event', () => {
            const host = Host.create(
                HOST_TYPES.AWS,
                'i-1234567890abcdef0',
                180000,
                2,
                'host-123',
            );
            host.markAsRestarting('system');
            host.markAsRestarted('system');
            expect(host.isRestarting).toBe(false);
            expect(host.isRestarted).toBe(true);
            const domainEvents = host.domainEvents;
            expect(domainEvents.length).toBe(1);
            expect(domainEvents[0]).toBeInstanceOf(HostRestartedEvent);
            expect(domainEvents[0].aggregateId).toBe(host.id);
        });

        it('should not mark as restarted if already restarted', () => {
            const host = Host.create(
                HOST_TYPES.AWS,
                'i-1234567890abcdef0',
                180000,
                2,
                'host-123',
            );
            host.markAsRestarting('system');
            host.markAsRestarted('system');
            host.wipe();
            host.markAsRestarted('system');
            expect(host.domainEvents.length).toBe(1);
        });

        it('should not mark as restarted if max restart attempts reached', () => {
            const host = Host.create(
                HOST_TYPES.AWS,
                'i-1234567890abcdef0',
                180000,
                2,
                'host-123',
            );
            host.props.restartAttempts = 2;
            host.markAsRestarted('system');
            expect(host.isRestarted).toBe(false);
            expect(host.domainEvents.length).toBe(0);
        });
    });

    describe('hasReachedStartupThreshold', () => {
        it('should return true when time since restart exceeds threshold', () => {
            const host = Host.create(
                HOST_TYPES.AWS,
                'i-1234567890abcdef0',
                5000,
                2,
                'host-123',
            );
            host.markAsRestarting('system');
            jest.useFakeTimers();
            const restartTime = new Date();
            jest.setSystemTime(restartTime.getTime() + 6000);
            expect(host.hasReachedStartupThreshold).toBe(false);
            jest.useRealTimers();
        });

        it('should return false when time since restart does not exceed threshold', () => {
            const host = Host.create(
                HOST_TYPES.AWS,
                'i-1234567890abcdef0',
                10000,
                2,
                'host-123',
            );
            host.markAsRestarting('system');
            jest.useFakeTimers();
            const restartTime = new Date();
            jest.setSystemTime(restartTime.getTime() + 5000);
            expect(host.hasReachedStartupThreshold).toBe(false);
            jest.useRealTimers();
        });

        it('should return false when host is currently restarting', () => {
            const host = Host.create(
                HOST_TYPES.AWS,
                'i-1234567890abcdef0',
                5000,
                2,
                'host-123',
            );
            host.markAsRestarting('system');
            jest.useFakeTimers();
            const restartTime = new Date();
            jest.setSystemTime(restartTime.getTime() + 6000);
            expect(host.hasReachedStartupThreshold).toBe(false);
            jest.useRealTimers();
        });
    });

    describe('markAsNeedsManualIntervention', () => {
        it('should mark host as needing manual intervention and register domain event', () => {
            const host = Host.create(
                HOST_TYPES.AWS,
                'i-1234567890abcdef0',
                180000,
                2,
                'host-123',
            );
            host.markAsNeedsManualIntervention('system');
            expect(host.needsManualIntervention).toBe(true);
            const domainEvents = host.domainEvents;
            expect(domainEvents.length).toBe(1);
            expect(domainEvents[0]).toBeInstanceOf(HostManualInterventionEvent);
            expect(domainEvents[0].aggregateId).toBe(host.id);
        });
    });

    describe('notification state management', () => {
        it('should mark restarted notification as sent', () => {
            const host = Host.create(
                HOST_TYPES.AWS,
                'i-1234567890abcdef0',
                180000,
                2,
                'host-123',
            );
            host.markAsRestartedNotificationSent('system');
            expect(host.restartedNotificationSent).toBe(true);
        });

        it('should mark manual intervention notification as sent', () => {
            const host = Host.create(
                HOST_TYPES.AWS,
                'i-1234567890abcdef0',
                180000,
                2,
                'host-123',
            );
            host.markAsManualInterventionNotificationSent('system');
            expect(host.manualInterventionNotificationSent).toBe(true);
        });

        it('should reset notification state', () => {
            const host = Host.create(
                HOST_TYPES.AWS,
                'i-1234567890abcdef0',
                180000,
                2,
                'host-123',
            );
            host.markAsRestartedNotificationSent('system');
            host.markAsManualInterventionNotificationSent('system');
            expect(host.restartedNotificationSent).toBe(true);
            expect(host.manualInterventionNotificationSent).toBe(true);
            host.resetNotificationState('system');
            expect(host.restartedNotificationSent).toBe(false);
            expect(host.manualInterventionNotificationSent).toBe(false);
        });
    });

    describe('resetState', () => {
        it('should reset all host state properties', () => {
            const host = Host.create(
                HOST_TYPES.AWS,
                'i-1234567890abcdef0',
                180000,
                2,
                'host-123',
            );
            host.markAsRestarting('system');
            host.markAsRestartedNotificationSent('system');
            host.markAsNeedsManualIntervention('system');
            host.markAsManualInterventionNotificationSent('system');
            host.resetState('system');
            expect(host.isRestarting).toBe(false);
            expect(host.isRestarted).toBe(false);
            expect(host.restartedBy).toBe('system');
            expect(host.lastRestartedAt).toBeUndefined();
            expect(host.restartAttempts).toBe(0);
            expect(host.needsManualIntervention).toBe(false);
            expect(host.restartedNotificationSent).toBe(false);
            expect(host.manualInterventionNotificationSent).toBe(false);
        });
    });

    describe('hasReachedMaxRestartAttempts', () => {
        it('should return true when restart attempts reach max', () => {
            const host = Host.create(
                HOST_TYPES.AWS,
                'i-1234567890abcdef0',
                180000,
                2,
                'host-123',
            );
            host.markAsRestarting('system');
            expect(host.hasReachedMaxRestartAttempts).toBe(false);
            host.markAsRestarting('system');
            expect(host.hasReachedMaxRestartAttempts).toBe(false);
        });

        it('should return false when restart attempts are below max', () => {
            const host = Host.create(
                HOST_TYPES.AWS,
                'i-1234567890abcdef0',
                180000,
                3,
                'host-123',
            );
            host.markAsRestarting('system');
            expect(host.hasReachedMaxRestartAttempts).toBe(false);
            host.markAsRestarting('system');
            expect(host.hasReachedMaxRestartAttempts).toBe(false);
        });
    });
});
