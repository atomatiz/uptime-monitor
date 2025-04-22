import { ConfigurationService } from '@core/configuration.service';
import { TokenStrategy } from '@interfaces/strategies/token.strategies';
import {
    Injectable,
    NestMiddleware,
    UnauthorizedException,
} from '@nestjs/common';
import { Request, Response, NextFunction } from 'express';
import * as jwt from 'jsonwebtoken';
// import * as Fingerprint from 'express-fingerprint';

@Injectable()
export class AuthMiddleware implements NestMiddleware {
    constructor(private readonly config: ConfigurationService) {}

    private extractTokenFromHeader(request: Request): string | undefined {
        const [type, token] = request.headers.authorization?.split(' ') ?? [];
        return type === 'Bearer' ? token : undefined;
    }

    async use(req: Request, res: Response, next: NextFunction) {
        const token = this.extractTokenFromHeader(req);

        if (!token) {
            throw new UnauthorizedException();
        }

        try {
            // const checkDeviceId = req.fingerprint?.hash;
            // const deviceId = TokenStrategy.getPayload(req.headers)?.['did'];
            // const userId = TokenStrategy.getPayload(req.headers)?.['sub'];

            // if (
            //     !deviceId ||
            //     !userId ||
            //     (checkDeviceId && checkDeviceId !== deviceId)
            // ) {
            //     throw new UnauthorizedException();
            // }

            // const session = await this.deviceSessionModel.findOne({
            //     user: userId,
            //     deviceId: deviceId,
            //     isSignedOut: false,
            // });

            // if (!session?.secretKey) {
            //     throw new UnauthorizedException();
            // }

            // const payload = TokenStrategy.verify(token, {
            //     secret: session.secretKey,
            // });

            const payload = TokenStrategy.verify(
                token,
                this.config.get('JWT_SECRET_KEY') || '',
            );

            if (!payload) {
                throw new UnauthorizedException();
            }

            req['user'] = payload;
            next();
        } catch (err: unknown) {
            if (err instanceof jwt.TokenExpiredError) {
                throw new UnauthorizedException('Token expired!');
            }
            if (err instanceof jwt.JsonWebTokenError) {
                throw new UnauthorizedException();
            }
        }
    }
}
