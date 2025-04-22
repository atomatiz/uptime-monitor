export const DATABASE_TYPES = {
    PRISMA: 'prisma',
    MONGOOSE: 'mongoose',
    ETC: 'etc',
} as const;

export const DATABASE_PROVIDER_TOKENS = {
    PRISMA_1: 'PRISMA_DATABASE_CONNECTION_1',
    MONGOOSE_1: 'MONGOOSE_DATABASE_CONNECTION_1',
} as const;
