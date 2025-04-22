import { DATABASE_PROVIDER_TOKENS } from '@common/constants/database.constants';

export const mongooseDatabaseProviders = [
    {
        provide: DATABASE_PROVIDER_TOKENS.MONGOOSE_1,
        useFactory: async () => {},
    },
];
