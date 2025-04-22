import { Optional } from '@nestjs/common';
import { DOMAINS, ENVIRONMENTS } from '@common/constants/global.constants';

export type ENVIRONMENT = (typeof ENVIRONMENTS)[keyof typeof ENVIRONMENTS];
export type Nullable<T> = T | null | undefined;
export type Optional<T> = T | undefined;

export type API_DOC = {
    name?: string;
    pass?: string;
};

export type DOMAIN_TYPE = (typeof DOMAINS)[keyof typeof DOMAINS];
