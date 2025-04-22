import { Injectable } from '@nestjs/common';
import { HostRepository } from '@application/host/repositories/host.repository';
import { EC2Client } from '@aws-sdk/client-ec2';
import { InstancesClient } from '@google-cloud/compute';
import * as oci from 'oci-sdk';
import { ComputeManagementClient } from '@azure/arm-compute';
import { ClientSecretCredential } from '@azure/identity';
import { AwsClient } from '@infrastructure/clients/hosts/aws.client';
import { GcpClient } from '@infrastructure/clients/hosts/gcp.client';
import { OciClient } from '@infrastructure/clients/hosts/oci.client';
import { AzureClient } from '@infrastructure/clients/hosts/azure.client';
import { CustomHostClient } from '@infrastructure/clients/hosts/custom-host.client';
import { HOST_TYPES } from '@common/domains/host/constants/host.constants';
import { LoggingService } from '@core/logging.service';
import { Config } from '@common/interfaces';
import { errorMessage } from '@common/utils';
import { HostMapper } from '../mapper/host.mapper';

interface IAwsClient {
    client: EC2Client;
    instanceId: string;
}

interface IGcpClient {
    client: InstancesClient;
    instanceId: string;
    projectId: string;
    zone: string;
}

interface IOciCLient {
    client: oci.core.ComputeClient;
    instanceId: string;
}

interface IAzureClient {
    client: ComputeManagementClient;
    instanceId: string;
    resourceGroupName: string;
}

interface ICustomHostClient {
    instanceId: string;
    restartCommand: string;
    checkTransitionalStatusCommand: string;
}

@Injectable()
export class HostRepositoryImpl extends HostRepository {
    private readonly logger = new LoggingService(HostRepositoryImpl.name);
    private readonly clientConfigMap: Map<
        string,
        IAwsClient | IGcpClient | IOciCLient | IAzureClient | ICustomHostClient
    > = new Map();
    private readonly clientsMap: Map<
        string,
        AwsClient | GcpClient | OciClient | AzureClient | CustomHostClient
    > = new Map();

    constructor(
        private readonly awsClient: AwsClient,
        private readonly gcpClient: GcpClient,
        private readonly ociClient: OciClient,
        private readonly azureClient: AzureClient,
        private readonly customHostClient: CustomHostClient,
    ) {
        super();
    }

    private storeHostClient(instanceId: string, config: Config): void {
        if (
            !this.clientConfigMap.has(instanceId) &&
            !this.clientsMap.has(instanceId)
        ) {
            if (!config || !config.host.hostType) {
                throw new Error(
                    `Config not found for instance ID: ${instanceId}`,
                );
            }

            let client:
                | EC2Client
                | InstancesClient
                | oci.core.ComputeClient
                | ComputeManagementClient;

            switch (config.host.hostType) {
                /**
                 * AWS Client
                 * @returns AWS client instance
                 */
                case HOST_TYPES.AWS:
                    if (!config.host.awsConfig) {
                        throw new Error(
                            `AWS config not found for instance ID: ${instanceId}`,
                        );
                    }
                    client = new EC2Client({
                        region: config.host.awsConfig.region,
                        credentials: {
                            accessKeyId: config.host.awsConfig.accessKeyId,
                            secretAccessKey:
                                config.host.awsConfig.secretAccessKey,
                        },
                    });
                    this.clientConfigMap.set(instanceId, {
                        client: client,
                        instanceId: instanceId,
                    });
                    this.clientsMap.set(instanceId, this.awsClient);
                    this.logger.log(
                        `AWS EC2 client initialized for instance ID: ${instanceId}`,
                    );
                    break;

                /**
                 * GCP Client
                 * @returns GCP client instance
                 */
                case HOST_TYPES.GCP:
                    if (!config.host.gcpConfig)
                        throw new Error(
                            `GCP config not found for instance ID: ${instanceId}`,
                        );
                    client = new InstancesClient({
                        projectId: config.host.gcpConfig.projectId,
                        credentials: {
                            client_email: config.host.gcpConfig.clientEmail,
                            private_key: config.host.gcpConfig.privateKey,
                        },
                    });
                    this.clientConfigMap.set(instanceId, {
                        client: client,
                        instanceId: instanceId,
                        projectId: config.host.gcpConfig.projectId,
                        zone: config.host.gcpConfig.zone,
                    });
                    this.clientsMap.set(instanceId, this.gcpClient);
                    this.logger.log(
                        `GCP Compute client initialized for instance ID: ${instanceId}`,
                    );
                    break;

                /**
                 * Azure Client
                 * @returns Azure client instance
                 */
                case HOST_TYPES.AZURE:
                    if (!config.host.azureConfig)
                        throw new Error(
                            `Azure config not found for instance ID: ${instanceId}`,
                        );
                    const credential = new ClientSecretCredential(
                        config.host.azureConfig.tenantId,
                        config.host.azureConfig.clientId,
                        config.host.azureConfig.clientSecret,
                    );
                    client = new ComputeManagementClient(
                        credential,
                        config.host.azureConfig.subscriptionId,
                    );
                    this.clientConfigMap.set(instanceId, {
                        client: client,
                        instanceId: instanceId,
                        resourceGroupName:
                            config.host.azureConfig.resourceGroupName,
                    });
                    this.clientsMap.set(instanceId, this.azureClient);
                    this.logger.log(
                        `Azure Compute client initialized for instance ID: ${instanceId}`,
                    );
                    break;

                /**
                 * OCI Client
                 * @returns OCI client instance
                 */
                case HOST_TYPES.OCI:
                    if (!config.host.ociConfig)
                        throw new Error(
                            `OCI config not found for instance ID: ${instanceId}`,
                        );
                    const endpoint = `https://iaas.${config.host.ociConfig.region}.oraclecloud.com`;
                    const provider =
                        new oci.common.SimpleAuthenticationDetailsProvider(
                            config.host.ociConfig.tenancyId,
                            config.host.ociConfig.userId,
                            config.host.ociConfig.keyFingerprint,
                            config.host.ociConfig.privateKey,
                            config.host.ociConfig.region,
                        );
                    client = new oci.core.ComputeClient({
                        authenticationDetailsProvider: provider,
                    });
                    (client as oci.core.ComputeClient).endpoint = endpoint;
                    this.clientConfigMap.set(instanceId, {
                        client: client,
                        instanceId: instanceId,
                    });
                    this.clientsMap.set(instanceId, this.ociClient);
                    this.logger.log(
                        `OCI Compute client initialized for instance ID: ${instanceId}`,
                    );
                    break;

                /**
                 * Custom Host Client
                 * @returns Custom Host client instance
                 */
                case HOST_TYPES.CUSTOM:
                    if (!config.host.customConfig)
                        throw new Error(
                            `Custom Host config not found for instance ID: ${instanceId}`,
                        );
                    this.clientConfigMap.set(instanceId, {
                        instanceId: instanceId,
                        restartCommand: config.host.customConfig.restartCommand,
                        checkTransitionalStatusCommand:
                            config.host.customConfig
                                .checkTransitionalStatusCommand,
                    });
                    this.clientsMap.set(instanceId, this.customHostClient);
                    this.logger.log(
                        `Custom Host client initialized for instance ID: ${instanceId}`,
                    );
                    break;

                default:
                    throw new Error(
                        `Unsupported host provider: ${config.host.hostType}`,
                    );
            }
        }
    }

    async restartHost(instanceId: string, config: Config): Promise<boolean> {
        let result: boolean;
        try {
            this.storeHostClient(instanceId, config);
            const client = this.clientsMap.get(instanceId);
            const clientData = this.clientConfigMap.get(instanceId);
            if (!client || !clientData) {
                this.logger.error(
                    errorMessage(
                        `No client ${!client ? 'configs' : !clientData ? 'data' : 'configs and data'} found for host with instance ID ${instanceId}`,
                    ),
                );
                return HostMapper.toDomain(false);
            }

            if (client instanceof AwsClient) {
                result = await client.restartHost(clientData as IAwsClient);
            } else if (client instanceof GcpClient) {
                result = await client.restartHost(clientData as IGcpClient);
            } else if (client instanceof OciClient) {
                result = await client.restartHost(clientData as IOciCLient);
            } else if (client instanceof AzureClient) {
                result = await client.restartHost(clientData as IAzureClient);
            } else if (client instanceof CustomHostClient) {
                result = await client.restartHost(
                    clientData as ICustomHostClient,
                );
            } else {
                throw new Error(
                    `Unsupported client type for instance ID: ${instanceId}`,
                );
            }
        } catch (error: unknown) {
            this.logger.error(
                errorMessage(
                    `Error restarting host instance: ${instanceId}`,
                    error,
                ),
            );
            return HostMapper.toDomain(false);
        }
        return HostMapper.toDomain(result);
    }

    async isRestarting(instanceId: string, config: Config): Promise<boolean> {
        this.storeHostClient(instanceId, config);
        const client = this.clientsMap.get(instanceId);
        const clientData = this.clientConfigMap.get(instanceId);
        let result: boolean;
        try {
            if (!client || !clientData) {
                this.logger.error(
                    errorMessage(
                        `No client ${!client ? 'configs' : !clientData ? 'data' : 'configs and data'} found for host with instance ID ${instanceId}`,
                    ),
                );
                return HostMapper.toDomain(false);
            }
            if (client instanceof AwsClient) {
                result = await client.isRestarting(clientData as IAwsClient);
            } else if (client instanceof GcpClient) {
                result = await client.isRestarting(clientData as IGcpClient);
            } else if (client instanceof OciClient) {
                result = await client.isRestarting(clientData as IOciCLient);
            } else if (client instanceof AzureClient) {
                result = await client.isRestarting(clientData as IAzureClient);
            } else if (client instanceof CustomHostClient) {
                result = await client.isRestarting(
                    clientData as ICustomHostClient,
                );
            } else {
                throw new Error(
                    `Unsupported client type for instance ID: ${instanceId}`,
                );
            }
        } catch (error: unknown) {
            this.logger.error(
                errorMessage(
                    `Error checking if host instance ${instanceId} is restarting`,
                    error,
                ),
            );
            return HostMapper.toDomain(false);
        }
        return HostMapper.toDomain(result);
    }
}
