import { HOST_TYPE } from '@common/domains/host';
import { NOTIFICATION_CHANNEL } from '@common/domains/notification/types/notification.types';

export interface HostConfig {
    hostType: HOST_TYPE;
    awsConfig?: {
        accessKeyId: string;
        secretAccessKey: string;
        region: string;
    };
    gcpConfig?: {
        projectId: string;
        clientEmail: string;
        privateKey: string;
        zone: string;
    };
    ociConfig?: {
        tenancyId: string;
        userId: string;
        keyFingerprint: string;
        privateKey: string;
        region: string;
    };
    azureConfig?: {
        tenantId: string;
        clientId: string;
        clientSecret: string;
        subscriptionId: string;
        resourceGroupName: string;
    };
    customConfig?: {
        restartCommand: string;
        checkTransitionalStatusCommand: string;
    };
}

export interface ChannelConfig {
    type: NOTIFICATION_CHANNEL;
    webhooks?: { endpoints: string[] };
    email?: {
        receivers: string[];
        host: string;
        port: number;
        from: string;
        pass: string;
    };
    sms?: {
        receivers: string[];
        accountSid: string;
        authToken: string;
        phoneNumber: string;
    };
    queues?: {
        rabbitmq: boolean;
        kafka: boolean;
        rabbitmqBroker?: string;
        kafkaBroker?: string;
    };
}

export interface Config {
    timezone: string;
    websiteId: string;
    websiteName: string;
    websiteUrl: string;
    instanceId: string;
    apiRetryAttempts: number;
    websiteDowntimeThreshold: number;
    maxRestartAttempts: number;
    hostStartupThreshold: number;
    host: HostConfig;
    channels: ChannelConfig[];
}
