import { Controller, Get, UseGuards } from '@nestjs/common';
import { ApiTags } from '@nestjs/swagger';
import { HealthCheck, HealthCheckResult } from '@nestjs/terminus';
import { ThrottlerGuard } from '@nestjs/throttler';
import { Public } from './decorators';

@ApiTags('Health')
@Controller('health')
export class HealthController {
    @Public()
    @UseGuards(ThrottlerGuard)
    @Get()
    @HealthCheck()
    async check(): Promise<HealthCheckResult> {
        return {
            status: 'ok',
            info: { application: { status: 'up' } },
            error: {},
            details: { application: { status: 'up' } },
        };
    }
}
