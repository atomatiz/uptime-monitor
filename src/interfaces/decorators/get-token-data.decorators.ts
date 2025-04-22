import { createParamDecorator, ExecutionContext } from '@nestjs/common';
import { TokenStrategy } from '../strategies/token.strategies';

export const UserId = createParamDecorator((ctx: ExecutionContext) => {
    const request = ctx.switchToHttp().getRequest();
    return TokenStrategy.getPayload(request.headers)!['sub'];
});

export const DeviceId = createParamDecorator((ctx: ExecutionContext) => {
    const request = ctx.switchToHttp().getRequest();
    return TokenStrategy.getPayload(request.headers)!['did'];
});

export const UserEmail = createParamDecorator((ctx: ExecutionContext) => {
    const request = ctx.switchToHttp().getRequest();
    return TokenStrategy.getPayload(request.headers)!['email'];
});

export const UserRoles = createParamDecorator((ctx: ExecutionContext) => {
    const request = ctx.switchToHttp().getRequest();
    return TokenStrategy.getPayload(request.headers)!['roles'];
});

export const UserMFA = createParamDecorator((ctx: ExecutionContext) => {
    const request = ctx.switchToHttp().getRequest();
    return TokenStrategy.getPayload(request.headers)!['mfa'];
});

export const UserOTP = createParamDecorator((ctx: ExecutionContext) => {
    const request = ctx.switchToHttp().getRequest();
    return TokenStrategy.getPayload(request.headers)!['otp'];
});

export const UserActivation = createParamDecorator((ctx: ExecutionContext) => {
    const request = ctx.switchToHttp().getRequest();
    return TokenStrategy.getPayload(request.headers)!['activated'];
});

export const TokenIAT = createParamDecorator((ctx: ExecutionContext) => {
    const request = ctx.switchToHttp().getRequest();
    return TokenStrategy.getPayload(request.headers)!['iat'];
});

export const TokenEXP = createParamDecorator((ctx: ExecutionContext) => {
    const request = ctx.switchToHttp().getRequest();
    return TokenStrategy.getPayload(request.headers)!['exp'];
});
