import { Notification } from '@domain/notification';

describe('Notification Entity', () => {
    describe('create', () => {
        it('should create a notification with valid parameters', () => {
            const notification = Notification.create(
                'correlation-123',
                'Test content',
                'email-template',
                { key: 'value' },
                'notification-123',
            );

            expect(notification).toBeDefined();
            expect(notification.id).toBe('notification-123');
            expect(notification.correlationId).toBe('correlation-123');
            expect(notification.content).toBe('Test content');
            expect(notification.template).toBe('email-template');
            expect(notification.metadata).toEqual({ key: 'value' });
            expect(notification.isProcessed).toBe(false);
        });

        it('should create a notification with default values', () => {
            const notification = Notification.create('correlation-123');

            expect(notification).toBeDefined();
            expect(notification.correlationId).toBe('correlation-123');
            expect(notification.content).toBeUndefined();
            expect(notification.template).toBeUndefined();
            expect(notification.metadata).toEqual({});
            expect(notification.isProcessed).toBe(false);
        });
    });

    describe('markAsSent', () => {
        it('should mark notification as sent', () => {
            const notification = Notification.create('correlation-123');

            jest.useFakeTimers();
            const now = new Date();
            jest.setSystemTime(now);

            notification.markAsSent('system');

            expect(notification.isProcessed).toBe(false);
            expect(notification.sentAt).toEqual(now);
            expect(notification.sentBy).toBe('system');

            jest.useRealTimers();
        });
    });

    describe('markAsPending', () => {
        it('should mark notification as pending', () => {
            const notification = Notification.create('correlation-123');
            notification.markAsPending('system');

            expect(notification.isPending).toBe(true);
        });
    });

    describe('markAsProcessed', () => {
        it('should mark notification as processed', () => {
            const notification = Notification.create('correlation-123');
            notification.markAsSent('system');

            jest.useFakeTimers();
            const now = new Date();
            jest.setSystemTime(now);

            notification.markAsProcessed('processor');

            expect(notification.isProcessed).toBe(true);
            expect(notification.isPending).toBe(false);
            expect(notification.processedAt).toEqual(now);
            jest.useRealTimers();
        });
    });

    describe('notification processing flow', () => {
        it('should follow the complete notification lifecycle', () => {
            const notification = Notification.create(
                'correlation-123',
                'Website is down',
                'alert-template',
                { websiteId: 'website-123', status: 'down' },
            );

            expect(notification.isProcessed).toBe(false);
            expect(notification.isPending).toBe(false);
            notification.markAsPending('system');
            expect(notification.isPending).toBe(true);

            notification.markAsSent('notification-service');
            expect(notification.sentAt).toBeDefined();
            expect(notification.sentBy).toBe('notification-service');

            notification.markAsProcessed('notification-processor');
            expect(notification.isProcessed).toBe(true);
            expect(notification.isPending).toBe(false);
            expect(notification.processedAt).toBeDefined();
        });
    });
});
