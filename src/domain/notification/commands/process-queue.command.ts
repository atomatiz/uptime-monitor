import { DOMAIN_TYPE } from '@common/types';

export class ProcessQueueCommand {
    constructor(
        public readonly aggregateId: string,
        public readonly domainType: DOMAIN_TYPE,
        public readonly eventName: string,
    ) {}
}
