import { Env } from '@common/configs/env.config';

export abstract class ConfigurationRepository<T = Env> {
    abstract get<K extends keyof T>(key: K): T[K];
    abstract set<K extends keyof T>(key: K, value: T[K]): void;
}
