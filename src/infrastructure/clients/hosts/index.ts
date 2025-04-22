import { AwsClient } from './aws.client';
import { AzureClient } from './azure.client';
import { CustomHostClient } from './custom-host.client';
import { GcpClient } from './gcp.client';
import { OciClient } from './oci.client';

export const HostClients = [
    AwsClient,
    GcpClient,
    AzureClient,
    OciClient,
    CustomHostClient,
];
