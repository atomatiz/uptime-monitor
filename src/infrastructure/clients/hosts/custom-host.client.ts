import { IHostClient } from '@common/domains/host';
import { execSync } from 'child_process';
import { errorMessage } from '@common/utils';
import { LoggingService } from '@core/logging.service';

export class CustomHostClient implements IHostClient {
    private readonly logger = new LoggingService(CustomHostClient.name);

    async restartHost({
        instanceId,
        restartCommand,
    }: {
        instanceId: string;
        restartCommand?: string;
    }): Promise<boolean> {
        try {
            execSync(restartCommand!, {
                stdio: 'pipe',
            })
                .toString()
                .trim();
            this.logger.log(`Custom instance ${instanceId} reboot initiated`);
            return true;
        } catch (error: unknown) {
            this.logger.error(
                errorMessage(
                    `Failed to restart Custom instance: ${instanceId}`,
                    error,
                ),
            );
            return false;
        }
    }

    async isRestarting({
        instanceId,
        checkTransitionalStatusCommand,
    }: {
        instanceId: string;
        checkTransitionalStatusCommand?: string;
    }): Promise<boolean> {
        try {
            const state = execSync(checkTransitionalStatusCommand!, {
                stdio: 'pipe',
            })
                .toString()
                .trim();
            this.logger.debug(`Custom instance ${instanceId} state: ${state}`);
            if (state.toLowerCase() === 'true') return true;
            if (state.toLowerCase() === 'false') return false;
            return false;
        } catch (error: unknown) {
            this.logger.error(
                errorMessage(
                    `Failed to check Custom instance ${instanceId} state`,
                    error,
                ),
            );
            return false;
        }
    }
}
