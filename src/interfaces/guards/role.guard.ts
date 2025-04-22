import {
    Injectable,
    CanActivate,
    ExecutionContext,
    UnauthorizedException,
} from '@nestjs/common';
import { Reflector } from '@nestjs/core';
import { IncomingMessage } from 'http';
import * as jwt from 'jsonwebtoken';
import { ROLE } from '@common/types/role.types';
import { TokenStrategy } from '@interfaces/strategies/token.strategies';
import { ConfigurationService } from '@core/configuration.service';

@Injectable()
export class RolesGuard implements CanActivate {
    constructor(
        private readonly reflector: Reflector,
        private readonly config: ConfigurationService,
    ) {}

    private getRequest<T>(context: ExecutionContext): T {
        return context.switchToHttp().getRequest();
    }

    private getToken(request: IncomingMessage): string {
        const authorization = request.headers['authorization'];
        if (!authorization || Array.isArray(authorization)) {
            throw new UnauthorizedException();
        }
        const [_, token] = authorization.split(' ');
        return token;
    }

    private compareArrays = (a: string[], b: string[]) => {
        return JSON.stringify(a) === JSON.stringify(b);
    };

    private matchRoles = (roles: string[], userRole: string[]) => {
        let result = false;
        const intersect = roles.filter((x) => userRole.includes(x));
        if (intersect.length !== 0 || intersect.length >= 1) {
            result = true;
        }
        return result;
    };

    async canActivate(context: ExecutionContext): Promise<boolean> {
        // Check if the route is marked as public
        const isPublic = this.reflector.getAllAndOverride<boolean>('isPublic', [
            context.getHandler(),
            context.getClass(),
        ]);

        // If the route is public, skip authentication check
        if (isPublic) {
            return true;
        }

        const roles = this.reflector.getAllAndOverride<ROLE[]>('roles', [
            context.getHandler(),
            context.getClass(),
        ]);
        if (!roles) {
            return true;
        }
        const request = this.getRequest<
            IncomingMessage & { user?: Record<string, unknown>; roles?: any }
        >(context);
        const token = this.getToken(request);
        if (!token) {
            throw new UnauthorizedException();
        }
        try {
            // const deviceId = TokenStrategy.getPayload(request.headers)!['did'];
            // const userId = TokenStrategy.getPayload(request.headers)!['sub'];
            // const secretKey = await this.deviceSessionModel.find({
            //     user: userId,
            //     deviceId: deviceId,
            //     isSignedOut: false,
            // });
            const secretKey = this.config.get('JWT_SECRET_KEY') || '';
            // if (!secretKey[0].secretKey ||) {
            //     throw new UnauthorizedException();
            // }
            if (!secretKey) {
                throw new UnauthorizedException();
            }
            // const payload = TokenStrategy.verify(token, secretKey[0].secretKey);
            const payload = TokenStrategy.verify(token, secretKey);
            if (!payload) {
                throw new UnauthorizedException();
            }
            request['roles'] = payload;
        } catch (err: unknown) {
            if (err instanceof jwt.TokenExpiredError) {
                throw new UnauthorizedException(`Token expired!`);
            }

            if (err instanceof jwt.JsonWebTokenError) {
                throw new UnauthorizedException();
            }

            throw new UnauthorizedException();
        }

        let result: boolean = false;
        const compare = this.compareArrays(roles, request['roles'].roles);
        if (!compare) {
            result = this.matchRoles(roles, request['roles'].roles);
        }

        return result;
    }
}
