import { generateWebsiteConfigs } from '@common/configs';
import { Config } from '@common/interfaces';
import { ConfigurationService } from '@core/configuration.service';
import aggregateStore from '@domain/aggregate-store';
import { Host } from '@domain/host';
import { RestartHostCommand } from '@domain/host/commands/restart-host.command';
import { CommandHandler, ICommandHandler } from '@nestjs/cqrs';
import { RestartHostUseCase } from '../use-cases/restart-host.use-case';

@CommandHandler(RestartHostCommand)
export class RestartHostCommandHandler
    implements ICommandHandler<RestartHostCommand>
{
    private readonly configs: Config[];

    constructor(
        private readonly restartHostUseCase: RestartHostUseCase,
        private readonly configService: ConfigurationService,
    ) {
        this.configs = generateWebsiteConfigs(this.configService);
    }

    async execute(command: RestartHostCommand): Promise<void> {
        const { aggregateId } = command;
        const host = aggregateStore.get<Host>(aggregateId);
        const config = this.configs.find(
            (c) => c.instanceId === host?.instanceId,
        );
        if (!aggregateId || !host || !config) return;
        await this.restartHostUseCase.execute(aggregateId, config);
    }
}
