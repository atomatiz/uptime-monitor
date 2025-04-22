import { INestApplication } from '@nestjs/common';
import { DocumentBuilder, SwaggerModule } from '@nestjs/swagger';
import { NextFunction, Request, Response } from 'express';
import { ConfigurationService } from '@core/configuration.service';
import { API_DOC_VERSION } from '../constants/global.constants';
import { HTTP_STATUS_CODES } from '../constants/http.constants';

export function initializeApiDoc(app: INestApplication) {
    const config = app.get(ConfigurationService);

    const swaggerConfig = new DocumentBuilder()
        .setTitle('Uptime Monitor API')
        .setDescription('API for monitoring website uptime')
        .setVersion('1.0.0-alpha')
        .addTag('Uptime Monitor')
        .addBearerAuth({ in: 'header', type: 'http' })
        .build();
    const document = SwaggerModule.createDocument(app, swaggerConfig);

    const basicAuthMiddleware = (
        req: Request,
        res: Response,
        next: NextFunction,
    ) => {
        const adapter = app.getHttpAdapter();

        function parseAuthHeader(input: string): {
            name: string;
            pass: string;
        } {
            const [, encodedPart] = input.split(' ');

            const buff = Buffer.from(encodedPart, 'base64');
            const text = buff.toString('ascii');
            const [name, pass] = text.split(':');

            return { name, pass };
        }

        function unauthorizedResponse(): void {
            if (adapter.getType() === 'fastify') {
                res.statusCode = HTTP_STATUS_CODES.UNAUTHORIZED;
                res.setHeader(
                    'WWW-Authenticate',
                    'Basic realm="Restricted Area"',
                );
                res.end('Unauthorized');
            } else {
                res.status(HTTP_STATUS_CODES.UNAUTHORIZED);
                res.set('WWW-Authenticate', 'Basic realm="Restricted Area"');
                res.send('Unauthorized');
            }
        }

        if (!req.headers.authorization) {
            return unauthorizedResponse();
        }

        const inputCreds = parseAuthHeader(req.headers.authorization);
        const apiCreds = config.getApiDocCreds();

        if (
            !inputCreds?.name ||
            !inputCreds?.pass ||
            inputCreds.name !== apiCreds?.name ||
            inputCreds.pass !== apiCreds?.pass
        ) {
            return unauthorizedResponse();
        }

        next();
    };

    const adapter = app.getHttpAdapter();
    adapter.use(API_DOC_VERSION, basicAuthMiddleware);
    SwaggerModule.setup(API_DOC_VERSION, app, document, {
        customSiteTitle: 'Uptime Monitor API',
        swaggerOptions: {
            persistAuthorization: true,
            displayRequestDuration: true,
        },
    });
}
