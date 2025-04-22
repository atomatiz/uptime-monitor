import { DOMAIN_TYPE } from '@common/types';

export class SendNotificationCommand {
    constructor(
        public readonly aggregateId: string,
        public readonly domainType: DOMAIN_TYPE,
        public readonly eventName?: string,
    ) {}
}
