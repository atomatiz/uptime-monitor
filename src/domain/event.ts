export interface DomainEvent {
    readonly aggregateId: string;
    readonly eventName: string;
}

export interface IncludeDomainEvents {
    get id(): string;
    get domainEvents(): ReadonlyArray<DomainEvent>;
    wipe(): void;
}
