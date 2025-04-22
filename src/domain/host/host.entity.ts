import AggregateRoot from '@domain/aggregate-root';
import { EntityProps } from '@domain/entity';
import { HOST_TYPE } from '@common/domains/host';
import { InstanceId } from '@domain/host/value-objects/instance-id.value-object';
import { HostRestartedEvent } from './events/host-restarted.event';
import { HostManualInterventionEvent } from './events/host-manual-intervention.event';

export interface HostProps extends EntityProps {
    hostType: HOST_TYPE;
    instanceId: InstanceId;
    startupThreshold: number;
    maxRestartAttempts?: number;
    restartAttempts: number;
    isRestarting?: boolean;
    isRestarted?: boolean;
    lastRestartedAt?: Date;
    restartedBy?: string;
    restartedNotificationSent?: boolean;
    needsManualIntervention?: boolean;
    manualInterventionNotificationSent?: boolean;
}

export class Host extends AggregateRoot<HostProps> {
    constructor(props: HostProps, id?: string) {
        super(props, id);
    }

    get hostType(): HOST_TYPE {
        return this.props.hostType;
    }

    get instanceId(): string {
        return this.props.instanceId.value;
    }

    get startupThreshold(): number {
        return this.props.startupThreshold || 180000;
    }

    get isRestarting(): boolean {
        return this.props.isRestarting ?? false;
    }

    get isRestarted(): boolean {
        return this.props.isRestarted ?? false;
    }

    get lastRestartedAt(): Date | undefined {
        return this.props.lastRestartedAt;
    }

    get hasReachedStartupThreshold(): boolean {
        if (
            this.isRestarting ||
            !this.props.lastRestartedAt ||
            !this.props.startupThreshold
        ) {
            return false;
        }
        return (
            new Date().getTime() - this.props.lastRestartedAt.getTime() >=
            this.props.startupThreshold
        );
    }

    get restartedBy(): string {
        return this.props.restartedBy ?? this.updatedBy;
    }

    get maxRestartAttempts(): number {
        return this.props.maxRestartAttempts || 2;
    }

    get restartAttempts(): number {
        return this.props.restartAttempts || 0;
    }

    get hasReachedMaxRestartAttempts(): boolean {
        return this.props.restartAttempts >= this.maxRestartAttempts;
    }

    get restartedNotificationSent(): boolean {
        return this.props.restartedNotificationSent ?? false;
    }

    get needsManualIntervention(): boolean {
        return this.props.needsManualIntervention ?? false;
    }

    get manualInterventionNotificationSent(): boolean {
        return this.props.manualInterventionNotificationSent ?? false;
    }

    static create(
        hostType: HOST_TYPE,
        instanceId: string,
        startupThreshold: number,
        maxRestartAttempts: number,
        id?: string,
    ): Host {
        const instanceIdObj: InstanceId = InstanceId.create(instanceId);

        return new Host(
            {
                hostType,
                instanceId: instanceIdObj,
                startupThreshold,
                maxRestartAttempts,
                restartAttempts: 0,
            },
            id,
        );
    }

    markAsRestarting(updater?: string): void {
        if (
            !this.isRestarting &&
            !this.hasReachedMaxRestartAttempts &&
            !this.hasReachedStartupThreshold
        ) {
            this.props.isRestarting = true;
            this.props.restartedBy = updater ?? this.updatedBy;
            this.props.lastRestartedAt = new Date();
            this.props.restartAttempts = ++this.props.restartAttempts;
            this.updateTimestamp(updater);
        }
    }

    markAsRestarted(updater?: string): void {
        if (!this.isRestarted && !this.hasReachedMaxRestartAttempts) {
            this.props.isRestarting = false;
            this.props.isRestarted = true;
            this.registerDomainEvent(new HostRestartedEvent(this.id));
            this.updateTimestamp(updater);
        }
    }

    markAsRestartedNotificationSent(updater?: string): void {
        this.props.restartedNotificationSent = true;
        this.updateTimestamp(updater);
    }

    markAsNeedsManualIntervention(updater?: string): void {
        this.props.needsManualIntervention = true;
        this.registerDomainEvent(new HostManualInterventionEvent(this.id));
        this.updateTimestamp(updater);
    }

    markAsManualInterventionNotificationSent(updater?: string): void {
        this.props.manualInterventionNotificationSent = true;
        this.updateTimestamp(updater);
    }

    resetNotificationState(updater?: string): void {
        this.props.restartedNotificationSent = false;
        this.props.manualInterventionNotificationSent = false;
        this.updateTimestamp(updater);
    }

    resetState(updater?: string): void {
        this.props.isRestarting = false;
        this.props.isRestarted = false;
        this.props.restartedBy = undefined;
        this.props.lastRestartedAt = undefined;
        this.props.restartAttempts = 0;
        this.props.needsManualIntervention = false;
        this.resetNotificationState();
        this.updateTimestamp(updater);
    }
}
