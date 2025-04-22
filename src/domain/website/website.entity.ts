import AggregateRoot from '@domain/aggregate-root';
import { EntityProps } from '@domain/entity';
import { WebsiteDownEvent } from './events/website-down.event';
import { WebsiteUpEvent } from './events/website-up.event';
import { WebsiteUrl } from '@domain/website/value-objects/website-url.value-object';
import { Host } from '@domain/host';

export interface WebsiteProps extends EntityProps {
    url: WebsiteUrl;
    name: string;
    host: Host;
    isOnline?: boolean;
    downtimeThreshold: number;
    downtimeStartTimestamp?: Date;
    lastTrackedAt?: Date;
    lastDowntime?: Date;
    totalDowntime?: number;
    trackingRetryAttempts: number;
    websiteDownNotificationSent?: boolean;
    websiteUpNotificationSent?: boolean;
}

export class Website extends AggregateRoot<WebsiteProps> {
    constructor(props: WebsiteProps, id?: string) {
        super(props, id);
    }

    get url(): string {
        return this.props.url.value;
    }

    get name(): string {
        return this.props.name;
    }

    get host(): Host {
        return this.props.host;
    }

    get isOnline(): boolean {
        return this.props.isOnline ?? true;
    }

    get downtimeThreshold(): number | undefined {
        return this.props.downtimeThreshold;
    }

    get downtimeStartTimestamp(): Date | undefined {
        return this.props.downtimeStartTimestamp;
    }

    get hasReachedDowntimeThreshold(): boolean {
        if (
            this.isOnline ||
            !this.props.downtimeStartTimestamp ||
            !this.props.downtimeThreshold
        ) {
            return false;
        }
        return (
            new Date().getTime() -
                this.props.downtimeStartTimestamp.getTime() >=
            this.props.downtimeThreshold
        );
    }

    get totalDowntime(): number {
        return this.props.totalDowntime || 0;
    }

    get trackingRetryAttempts(): number {
        return this.props.trackingRetryAttempts || 2;
    }

    get lastTrackedAt(): Date | undefined {
        return this.props.lastTrackedAt;
    }

    get lastDowntime(): Date | undefined {
        return this.props.lastDowntime;
    }

    get websiteDownNotificationSent(): boolean {
        return this.props.websiteDownNotificationSent ?? false;
    }

    get websiteUpNotificationSent(): boolean {
        return this.props.websiteUpNotificationSent ?? false;
    }
    static create(
        url: string,
        name: string,
        host: Host,
        trackingRetryAttempts: number,
        downtimeThreshold: number,
        id?: string,
    ): Website {
        if (!url) {
            throw new Error('Website URL is required');
        }

        if (!name) {
            throw new Error('Website name is required');
        }

        return new Website(
            {
                url: WebsiteUrl.create(url),
                name,
                host,
                trackingRetryAttempts: trackingRetryAttempts,
                isOnline: true,
                downtimeThreshold,
                totalDowntime: 0,
            },
            id,
        );
    }

    markAsDown(updater?: string): void {
        if (this.props.isOnline) {
            this.props.isOnline = false;
            this.props.downtimeStartTimestamp = new Date();
            this.props.lastDowntime = new Date();
            this.props.totalDowntime = 0;
            if (!this.websiteDownNotificationSent) {
                this.registerDomainEvent(new WebsiteDownEvent(this.id));
            }

            this.updateTimestamp(updater);
        }
    }

    markAsUp(updater?: string): void {
        if (!this.isOnline) {
            this.props.isOnline = true;
            this.props.lastTrackedAt = new Date();

            if (this.props.downtimeStartTimestamp) {
                const downtime =
                    new Date().getTime() -
                    this.props.downtimeStartTimestamp.getTime();
                this.props.totalDowntime = downtime;
                this.props.downtimeStartTimestamp = undefined;
            }

            this.registerDomainEvent(new WebsiteUpEvent(this.id));
            this.updateTimestamp(updater);
        }
    }

    markWebsiteDownNotificationSent(updater?: string): void {
        this.props.websiteDownNotificationSent = true;
        this.updateTimestamp(updater);
    }

    markWebsiteUpNotificationSent(updater?: string): void {
        this.props.websiteUpNotificationSent = true;
        this.updateTimestamp(updater);
    }

    resetNotificationState(updater?: string): void {
        this.props.websiteDownNotificationSent = false;
        this.props.websiteUpNotificationSent = false;
        this.updateTimestamp(updater);
    }

    resetState(updater?: string): void {
        this.props.isOnline = true;
        this.props.downtimeStartTimestamp = undefined;
        this.props.totalDowntime = 0;
        this.props.lastTrackedAt = new Date();
        this.props.lastDowntime = undefined;
        this.resetNotificationState();
        this.updateTimestamp(updater);
    }
}
