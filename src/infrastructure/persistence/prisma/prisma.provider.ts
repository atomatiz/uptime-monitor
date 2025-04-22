import { DATABASE_PROVIDER_TOKENS } from '@common/constants/database.constants';

export const prismaDatabaseProviders = [
    {
        provide: DATABASE_PROVIDER_TOKENS.PRISMA_1,
        useFactory: async () => {},
    },
];
