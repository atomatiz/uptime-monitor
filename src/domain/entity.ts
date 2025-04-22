import { DEFAULT_SYSTEM_ROLE } from '@common/constants/global.constants';

export interface EntityProps {
    createdAt?: Date;
    updatedAt?: Date;
    createdBy?: string;
    updatedBy?: string;
}

export abstract class Entity<TProps extends EntityProps> {
    private readonly _id: string;
    public props: TProps;

    constructor(props: TProps, id?: string) {
        this._id = id || crypto.randomUUID();
        this.props = {
            ...props,
            createdAt: props.createdAt ?? new Date(),
            updatedAt: props.updatedAt ?? new Date(),
            createdBy: props.createdBy ?? DEFAULT_SYSTEM_ROLE,
            updatedBy: props.updatedBy ?? DEFAULT_SYSTEM_ROLE,
        };
    }

    get id(): string {
        return this._id;
    }

    get createdAt(): Date {
        return this.props.createdAt!;
    }

    get updatedAt(): Date {
        return this.props.updatedAt!;
    }

    get createdBy(): string {
        return this.props.createdBy!;
    }

    get updatedBy(): string {
        return this.props.updatedBy!;
    }

    protected updateTimestamp(updater: string): void {
        this.props.updatedAt = new Date();
        this.props.updatedBy = updater ?? DEFAULT_SYSTEM_ROLE;
    }
}
