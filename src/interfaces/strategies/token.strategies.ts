import { TOKEN_EXPIRATION_TIME } from '@common/constants/auth.constants';
import { UnauthorizedException } from '@nestjs/common';
import * as jwt from 'jsonwebtoken';
import { IncomingHttpHeaders } from 'http';

export class TokenStrategy {
    static generate(payload: object, secretKey: string | Buffer) {
        return jwt.sign(
            {
                ...payload,
                exp: Math.floor(Date.now() / 1000) + TOKEN_EXPIRATION_TIME,
            },
            secretKey,
            typeof secretKey === 'string' ? undefined : { algorithm: 'RS256' },
        );
    }
    static decode(token: string) {
        return jwt.decode(token.replace('Bearer ', ''));
    }
    static verify(token: string, secretKey: string | Buffer) {
        return jwt.verify(
            token.replace('Bearer ', ''),
            secretKey,
            typeof secretKey === 'string'
                ? undefined
                : { algorithms: ['RS256'] },
        );
    }

    static getPayload(headers: IncomingHttpHeaders) {
        if (!headers.authorization) {
            throw new UnauthorizedException();
        }
        return this.decode(headers.authorization);
    }
}
