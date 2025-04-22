import { DynamicModule, Module } from '@nestjs/common';
import { MongooseModule } from '@infrastructure/persistence/mongoose/mongoose.module';
import { PrismaModule } from '@infrastructure/persistence/prisma/prisma.module';
import { DatabaseOptions } from '@common/interfaces/database.interfaces';

@Module({})
export class PersistenceModule {
    static register({ global = false, types }: DatabaseOptions): DynamicModule {
        const databaseModules = {
            prisma: PrismaModule,
            mongoose: MongooseModule,
            // Add more database types here as needed
        };

        const imports = types
            .filter((type) => databaseModules[type])
            .map((type) => databaseModules[type]);

        if (imports.length === 0) {
            throw new Error('No valid database types provided');
        }

        return {
            global,
            module: PersistenceModule,
            imports,
            exports: imports,
        };
    }
}
