import { ComputeManagementClient } from '@azure/arm-compute';
import { IHostClient } from '@common/domains/host/interfaces/host.interface';
import { LoggingService } from '@core/logging.service';
import { errorMessage } from '@common/utils/error-message.utils';

export class AzureClient implements IHostClient {
    private readonly logger = new LoggingService(AzureClient.name);

    async restartHost({
        client,
        instanceId,
        resourceGroupName,
    }: {
        client: ComputeManagementClient;
        instanceId: string;
        resourceGroupName?: string;
    }): Promise<boolean> {
        try {
            if (!resourceGroupName) {
                throw new Error(
                    'Resource group name is required for Azure VM operations',
                );
            }
            const poller = await client.virtualMachines.beginRestart(
                resourceGroupName,
                instanceId,
            );
            this.logger.log(`Azure VM ${instanceId} restart initiated`);
            await new Promise((resolve) => setTimeout(resolve, 5000));
            return (
                poller.getOperationState().status === 'running' ||
                poller.getOperationState().status === 'succeeded'
            );
        } catch (error: unknown) {
            this.logger.error(
                errorMessage(`Failed to restart Azure VM ${instanceId}`, error),
            );
            return false;
        }
    }

    async isRestarting({
        client,
        instanceId,
        resourceGroupName,
    }: {
        client: ComputeManagementClient;
        instanceId: string;
        resourceGroupName?: string;
    }): Promise<boolean> {
        try {
            if (!resourceGroupName) {
                throw new Error(
                    'Resource group name is required for Azure VM operations',
                );
            }

            const instance = await client.virtualMachines.get(
                resourceGroupName,
                instanceId,
                { expand: 'instanceView' },
            );

            if (!instance) {
                this.logger.warn(
                    `No VM found with name ${instanceId} in resource group ${resourceGroupName}`,
                );
                return false;
            }

            const powerState = instance.instanceView?.statuses
                ?.find((status) => status.code?.startsWith('PowerState/'))
                ?.code?.replace('PowerState/', '');

            return (
                powerState === 'starting' ||
                powerState === 'stopping' ||
                powerState === 'restarting'
            );
        } catch (error: unknown) {
            this.logger.error(
                errorMessage(
                    `Failed to check Azure VM ${instanceId} state`,
                    error,
                ),
            );
            return false;
        }
    }
}
