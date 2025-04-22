import { NestFactory } from '@nestjs/core';
import { NestExpressApplication } from '@nestjs/platform-express';
import { AppModule } from './app.module';
import { initializeApiDoc } from '@common/configs';
import {
    API_VERSION,
    HTTP_METHODS,
    HTTP_STATUS_CODES,
} from '@common/constants';
import { ConfigurationService } from '@core/configuration.service';
import { LoggingService } from '@core/logging.service';
import { AllExceptionsFilter } from '@interfaces/filters';
import {
    LoggingInterceptor,
    TransformInterceptor,
} from '@interfaces/interceptors';
import { ValidationPipe } from '@nestjs/common';
import helmet from 'helmet';
import * as cors from 'cors';
import * as bodyParser from 'body-parser';
import * as cookieParser from 'cookie-parser';
import * as compression from 'compression';
import { doubleCsrf, DoubleCsrfConfigOptions } from 'csrf-csrf';
import * as os from 'os';
import './instrument';

declare const module: any;

async function bootstrap(): Promise<void> {
    const logger = new LoggingService(bootstrap.name);
    const app = await NestFactory.create<NestExpressApplication>(AppModule, {
        forceCloseConnections: true,
        snapshot: true,
        rawBody: true,
        logger: logger,
    });

    const config = app.get(ConfigurationService);

    // API versioning
    app.setGlobalPrefix(API_VERSION, {
        exclude: ['health'],
    });

    // Increase thread pool size
    config.set('UV_THREADPOOL_SIZE', os.cpus().length.toString());

    // Security
    app.use(helmet());
    app.getHttpAdapter().getInstance().set('trust proxy', true);
    app.use((req, res, next) => {
        const clientIp =
            req.headers['x-real-ip'] ||
            req.headers['x-forwarded-for'] ||
            req.connection.remoteAddress;
        const clients: string = config.get<string>('ALLOWED_ORIGINS');
        const allowedOrigins = clients
            .split(',')
            .map((origin) => origin.trim())
            .filter(Boolean);
        const trustedIps: (string | RegExp)[] = [
            '127.0.0.1',
            '::1',
            /^10\.0\.d+\.d+$/,
            /^::ffff:10\.0\.d+\.d+$/,
        ];
        const appOrigin = `http://[::1]:${config.get('PORT')}`;
        const isTrustedIp = trustedIps.some((ip) => {
            const match =
                typeof ip === 'string' ? clientIp === ip : ip.test(clientIp);
            return match;
        });
        const allAllowedOrigins = [...allowedOrigins, appOrigin];
        let isCorsAllowed = false;

        cors({
            origin: (origin, callback) => {
                if (isTrustedIp) {
                    isCorsAllowed = true;
                    callback(null, true);
                } else if (
                    allAllowedOrigins.includes('*') ||
                    (origin && allAllowedOrigins.includes(origin))
                ) {
                    isCorsAllowed = true;
                    callback(null, true);
                } else {
                    isCorsAllowed = false;
                    callback(null, false);
                }
            },
            methods: ['GET', 'OPTIONS'],
            allowedHeaders: ['Content-Type', 'Authorization', 'Accept'],
            credentials: true,
            optionsSuccessStatus: HTTP_STATUS_CODES.NO_CONTENT,
        })(req, res, (err) => {
            const origin = req.headers.origin;

            if (origin) {
                if (!isCorsAllowed) {
                    return res.status(HTTP_STATUS_CODES.FORBIDDEN).send({
                        message: 'Forbidden Resource',
                        statusCode: HTTP_STATUS_CODES.FORBIDDEN,
                        timestamp: new Date().toISOString(),
                        success: false,
                        path: req.path,
                        method: HTTP_METHODS.GET,
                    });
                }

                if (allowedOrigins.includes('*')) {
                    res.setHeader('Access-Control-Allow-Origin', '*');
                    res.setHeader('Vary', 'Origin');
                } else {
                    res.setHeader('Access-Control-Allow-Origin', origin);
                    res.setHeader('Vary', 'Origin');
                }
            }

            if (err) {
                return res.status(HTTP_STATUS_CODES.BAD_REQUEST).send({
                    message: 'CORS Processing Issue',
                    statusCode: HTTP_STATUS_CODES.BAD_REQUEST,
                    timestamp: new Date().toISOString(),
                    success: false,
                    path: req.path,
                    method: HTTP_METHODS.GET,
                });
            }

            next();
        });
    });
    const doubleCsrfOptions: DoubleCsrfConfigOptions = {
        getSecret: () => config.get('CSRF_SECRET_KEY')!,
        cookieName: `__${config.get('APP_NAME')?.toLocaleLowerCase() ?? 'uptime-monitor'}-csrf`,
        cookieOptions: {
            secure: true,
            httpOnly: true,
            sameSite: 'strict',
        },
        size: 64,
        ignoredMethods: ['GET', 'HEAD', 'OPTIONS'],
    };
    const { doubleCsrfProtection } = doubleCsrf(doubleCsrfOptions);
    app.use(doubleCsrfProtection);

    // Middleware
    app.use(cookieParser());
    app.useGlobalInterceptors(
        new LoggingInterceptor(),
        new TransformInterceptor(),
    );
    app.useGlobalFilters(new AllExceptionsFilter());
    app.useGlobalPipes(
        new ValidationPipe({
            whitelist: true,
            transform: true,
            forbidNonWhitelisted: true,
        }),
    );
    app.use(bodyParser.json({ limit: '50mb' }));
    app.use(bodyParser.urlencoded({ limit: '50mb', extended: true }));
    app.use(compression());

    // API documentation
    if (config.isDevelopmentOrStagingOrPreprod()) {
        initializeApiDoc(app);
    }

    // Start the application
    app.enableShutdownHooks();
    await app.listen(config.get('PORT') || 8001, async () =>
        logger.log(
            `Application is running -mode ${config.get('NODE_ENV')} -endpoint ${await app.getUrl()}`,
        ),
    );

    // Hot module replacement
    if (module.hot) {
        module.hot.accept();
        module.hot.dispose(() => app.close());
    }
}
bootstrap().catch((error: any) => {
    console.error('Application failed to start:', error);
    process.exit(1);
});
