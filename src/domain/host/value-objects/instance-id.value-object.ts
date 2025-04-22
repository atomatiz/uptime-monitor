import { ValueObject } from '@domain/value-object';

interface InstanceIdProps {
    value: string;
}

export class InstanceId extends ValueObject<InstanceIdProps> {
    private constructor(props: InstanceIdProps) {
        super(props);
    }

    get value(): string {
        return this.props.value;
    }

    public static create(instanceId: string): InstanceId {
        if (!instanceId) {
            throw new Error('Instance ID cannot be empty');
        }

        const isAWS = /^i-[0-9a-f]{8,17}$/.test(instanceId);
        const isGCP = /^[a-z]([a-z0-9-]{0,61}[a-z0-9])?$/.test(instanceId);
        const isOCI = /^ocid1\.instance\.oc1\..+/.test(instanceId);

        if (!(isAWS || isGCP || isOCI)) {
            throw new Error(`Invalid Instance ID: ${instanceId}`);
        }

        return new InstanceId({ value: instanceId });
    }

    public toString(): string {
        return this.props.value;
    }
}
