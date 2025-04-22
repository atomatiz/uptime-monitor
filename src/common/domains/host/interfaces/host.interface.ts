import { EC2Client } from '@aws-sdk/client-ec2';
import { InstancesClient } from '@google-cloud/compute';
import * as oci from 'oci-sdk';
import { ComputeManagementClient } from '@azure/arm-compute';

export interface IHostClient {
    restartHost({
        client,
        instanceId,
        projectId,
        zone,
        resourceGroupName,
        restartCommand,
    }: {
        client?:
            | EC2Client
            | InstancesClient
            | oci.core.ComputeClient
            | ComputeManagementClient;
        instanceId: string;
        projectId?: string;
        zone?: string;
        resourceGroupName?: string;
        restartCommand?: string;
    }): Promise<boolean>;
    isRestarting({
        client,
        instanceId,
        projectId,
        zone,
    }: {
        client:
            | EC2Client
            | InstancesClient
            | oci.core.ComputeClient
            | ComputeManagementClient;
        instanceId: string;
        projectId?: string;
        zone?: string;
        resourceGroupName?: string;
        checkTransitionalStatusCommand?: string;
    }): Promise<boolean>;
}
