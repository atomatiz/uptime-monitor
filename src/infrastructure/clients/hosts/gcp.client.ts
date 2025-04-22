import { InstancesClient } from '@google-cloud/compute';
import { IHostClient } from '@common/domains/host/interfaces/host.interface';
import { LoggingService } from '@core/logging.service';
import { errorMessage } from '@common/utils/error-message.utils';

export class GcpClient implements IHostClient {
    private readonly logger = new LoggingService(GcpClient.name);

    async restartHost({
        client,
        instanceId,
        projectId,
        zone,
    }: {
        client: InstancesClient;
        instanceId: string;
        projectId?: string;
        zone?: string;
    }): Promise<boolean> {
        try {
            const response = await client.reset({
                project: projectId,
                zone: zone,
                instance: instanceId,
            });
            this.logger.log(`GCP instance ${instanceId} reset initiated`);
            await new Promise((resolve) => setTimeout(resolve, 5000));
            return (
                response[1]?.status === 'DONE' ||
                response[1]?.status === 'PENDING' ||
                response[1]?.status === 'RUNNING'
            );
        } catch (error: unknown) {
            this.logger.error(
                errorMessage(
                    `Failed to restart GCP instance ${instanceId}`,
                    error,
                ),
            );
            return false;
        }
    }

    async isRestarting({
        client,
        instanceId,
        projectId,
        zone,
    }: {
        client: InstancesClient;
        instanceId: string;
        projectId?: string;
        zone?: string;
    }): Promise<boolean> {
        try {
            const [instance] = await client.get({
                project: projectId,
                zone: zone,
                instance: instanceId,
            });
            if (!instance) {
                this.logger.warn(`No instance data found for ${instanceId}`);
                return false;
            }
            const status = instance.status;
            this.logger.debug(`GCP instance ${instanceId} status: ${status}`);
            return status === 'PROVISIONING' || status === 'STAGING';
        } catch (error: unknown) {
            this.logger.error(
                errorMessage(
                    `Failed to check GCP instance ${instanceId} status`,
                    error,
                ),
            );
            return false;
        }
    }
}
