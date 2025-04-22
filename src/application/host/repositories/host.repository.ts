import { Config } from '@common/interfaces';

export abstract class HostRepository {
    abstract restartHost(instanceId: string, config: Config): Promise<boolean>;
    abstract isRestarting(instanceId: string, config: Config): Promise<boolean>;
}
