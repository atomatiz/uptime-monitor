import { Module } from '@nestjs/common';
import { prismaDatabaseProviders } from './prisma.provider';

@Module({
    imports: [],
    providers: [...prismaDatabaseProviders],
    exports: [...prismaDatabaseProviders],
})
export class PrismaModule {}
