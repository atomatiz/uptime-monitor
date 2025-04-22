import * as oci from 'oci-sdk';
import { IHostClient } from '@common/domains/host/interfaces/host.interface';
import { LoggingService } from '@core/logging.service';
import { errorMessage } from '@common/utils/error-message.utils';

export class OciClient implements IHostClient {
    private readonly logger = new LoggingService(OciClient.name);

    async restartHost({
        client,
        instanceId,
    }: {
        client: oci.core.ComputeClient;
        instanceId: string;
    }): Promise<boolean> {
        try {
            const response = await client.instanceAction({
                instanceId: instanceId,
                action: 'RESET',
            });
            this.logger.log(`OCI instance ${instanceId} reset initiated`);
            await new Promise((resolve) => setTimeout(resolve, 5000));
            return (
                response.instance.lifecycleState ===
                    oci.core.models.Instance.LifecycleState.Starting ||
                response.instance.lifecycleState ===
                    oci.core.models.Instance.LifecycleState.Stopping ||
                response.instance.lifecycleState ===
                    oci.core.models.Instance.LifecycleState.Running
            );
        } catch (error: unknown) {
            this.logger.error(
                errorMessage(
                    `Failed to restart OCI instance ${instanceId}`,
                    error,
                ),
            );
            return false;
        }
    }

    async isRestarting({
        client,
        instanceId,
    }: {
        client: oci.core.ComputeClient;
        instanceId: string;
    }): Promise<boolean> {
        try {
            const response = await client.getInstance({ instanceId });
            const state = response.instance.lifecycleState;
            this.logger.debug(`OCI instance ${instanceId} state: ${state}`);
            return (
                state === oci.core.models.Instance.LifecycleState.Starting ||
                state === oci.core.models.Instance.LifecycleState.Stopping
            );
        } catch (error: unknown) {
            this.logger.error(
                errorMessage(
                    `Failed to check OCI instance ${instanceId} state`,
                    error,
                ),
            );
            return false;
        }
    }
}
