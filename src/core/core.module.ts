import { Module } from '@nestjs/common';
import { ConfigModule } from '@nestjs/config';
import { envSchema } from '@common/configs/env.config';
import { ConfigurationService } from './configuration.service';
import { LoggingService } from './logging.service';
import { ENVIRONMENTS } from '@common/constants/global.constants';

@Module({
    imports: [
        ConfigModule.forRoot({
            envFilePath: `.env.${process.env.NODE_ENV ?? ENVIRONMENTS.Development}`,
            validate: (env) => envSchema.parse(env),
            isGlobal: true,
            cache: true,
            validationOptions: {
                abortEarly: false,
            },
            expandVariables: true,
        }),
    ],
    providers: [ConfigurationService, LoggingService],
    exports: [ConfigurationService, LoggingService],
})
export class CoreModule {}
