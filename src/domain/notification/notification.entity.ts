import AggregateRoot from '@domain/aggregate-root';
import { EntityProps } from '@domain/entity';

export interface NotificationProps extends EntityProps {
    correlationId: string;
    content?: string;
    template?: string;
    metadata?: Record<string, unknown>;
    sentAt?: Date;
    sentBy?: string;
    isPending?: boolean;
    isProcessed?: boolean;
    processedBy?: string;
    processedAt?: Date;
}

export class Notification extends AggregateRoot<NotificationProps> {
    constructor(props: NotificationProps, id?: string) {
        super(props, id);
    }

    get correlationId(): string | undefined {
        return this.props.correlationId;
    }

    get content(): string | undefined {
        return this.props.content;
    }

    get template(): string | undefined {
        return this.props.template;
    }

    get metadata(): Record<string, unknown> | undefined {
        return this.props.metadata;
    }

    get sentAt(): Date | undefined {
        return this.props.sentAt;
    }

    get sentBy(): string | undefined {
        return this.props.sentBy;
    }

    get isPending(): boolean {
        return this.props.isPending ?? false;
    }

    get isProcessed(): boolean {
        return this.props.isProcessed ?? false;
    }

    get processedBy(): string | undefined {
        return this.props.processedBy;
    }

    get processedAt(): Date | undefined {
        return this.props.processedAt;
    }

    set metadata(value: Record<string, unknown> | undefined) {
        this.props.metadata = value;
    }

    static create(
        correlationId: string,
        content?: string,
        template?: string,
        metadata?: Record<string, unknown>,
        id?: string,
    ): Notification {
        return new Notification(
            {
                correlationId,
                content,
                template,
                metadata: metadata ?? {},
                isProcessed: false,
            },
            id,
        );
    }

    markAsSent(updater?: string): void {
        this.props.isProcessed = false;
        this.props.sentAt = new Date();
        this.props.sentBy = updater ?? this.updatedBy;
        this.updateTimestamp(updater);
    }

    markAsPending(updater?: string): void {
        this.props.isPending = true;
        this.updateTimestamp(updater);
    }

    markAsProcessed(updater?: string): void {
        this.props.isProcessed = true;
        this.props.isPending = false;
        this.props.processedAt = new Date();
        this.updateTimestamp(updater);
    }
}
