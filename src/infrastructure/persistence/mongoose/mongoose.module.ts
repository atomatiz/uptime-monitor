import { Module } from '@nestjs/common';
import { mongooseDatabaseProviders } from './mongoose.provider';

@Module({
    providers: [...mongooseDatabaseProviders],
    exports: [...mongooseDatabaseProviders],
})
export class MongooseModule {}
