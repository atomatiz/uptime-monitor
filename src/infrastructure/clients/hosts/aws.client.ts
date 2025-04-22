import {
    RebootInstancesCommand,
    DescribeInstancesCommand,
    EC2Client,
} from '@aws-sdk/client-ec2';
import { IHostClient } from '@common/domains/host';
import { errorMessage } from '@common/utils';
import { LoggingService } from '@core/logging.service';

export class AwsClient implements IHostClient {
    private readonly logger = new LoggingService(AwsClient.name);

    async restartHost({
        client,
        instanceId,
    }: {
        client: EC2Client;
        instanceId: string;
    }): Promise<boolean> {
        try {
            const response = await client.send(
                new RebootInstancesCommand({ InstanceIds: [instanceId] }),
            );
            this.logger.log(`AWS instance ${instanceId} reboot initiated`);
            return (
                response.$metadata.httpStatusCode === 200 ||
                response.$metadata.httpStatusCode === 201
            );
        } catch (error: unknown) {
            this.logger.error(
                errorMessage(
                    `Failed to restart AWS instance ${instanceId}`,
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
        client: EC2Client;
        instanceId: string;
    }): Promise<boolean> {
        try {
            const response = await client.send(
                new DescribeInstancesCommand({ InstanceIds: [instanceId] }),
            );
            const state =
                response.Reservations?.[0]?.Instances?.[0]?.State?.Name;
            this.logger.debug(`AWS instance ${instanceId} state: ${state}`);
            return state === 'pending' || state === 'stopping';
        } catch (error: unknown) {
            this.logger.error(
                errorMessage(
                    `Failed to check AWS instance ${instanceId} state`,
                    error,
                ),
            );
            return false;
        }
    }
}
