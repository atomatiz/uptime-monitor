import {
    DEFAULT_TIMEZONE,
    URL_REGEX_PATTERN,
} from '@common/constants/global.constants';
import { HOST_TYPES } from '@common/domains/host/constants/host.constants';
import { HOST_TYPE } from '@common/domains/host/types/host.types';
import {
    NOTIFICATION_CHANNELS,
    QUEUE_TYPES,
} from '@common/domains/notification/constants/notification.constants';
import { QUEUE_TYPE } from '@common/domains/notification/types/notification.types';
import {
    Config,
    ChannelConfig,
    HostConfig,
} from '@common/interfaces/configuration.interfaces';
import { ConfigurationService } from '@core/configuration.service';

export const generateWebsiteConfigs = (
    configService: ConfigurationService,
): Config[] => {
    const configs: Config[] = [];

    const envKeys = Object.keys(process.env);
    const websiteIds = envKeys
        .filter(
            (key) => key.startsWith('WEBSITE_') && key.includes('_WEBSITE_URL'),
        )
        .map((key) => key.split('_')[1])
        .filter((id, idx, self) => self.indexOf(id) === idx);

    if (websiteIds.length === 0) {
        return [];
    }

    websiteIds.forEach((id) => {
        const prefix = `WEBSITE_${id}_`;
        const host: HostConfig = { hostType: HOST_TYPES.AWS };
        const channels: ChannelConfig[] = [];

        const enableWebhook =
            configService.getWebsiteConfigs<boolean>(
                `${prefix}ENABLE_WEBHOOK`,
            ) || false;
        if (enableWebhook) {
            const webhookUrls: string[] = [];
            const discordWebhook = configService.get(
                `WEBSITE_${id}_DISCORD_WEBHOOK_URL`,
            );
            const slackWebhook = configService.get(
                `WEBSITE_${id}_SLACK_WEBHOOK_URL`,
            );
            const teamsWebhook = configService.get(
                `WEBSITE_${id}_TEAMS_WEBHOOK_URL`,
            );

            if (discordWebhook) webhookUrls.push(discordWebhook);
            if (slackWebhook) webhookUrls.push(slackWebhook);
            if (teamsWebhook) webhookUrls.push(teamsWebhook);

            if (webhookUrls.length > 0) {
                channels.push({
                    type: NOTIFICATION_CHANNELS.WEBHOOK,
                    webhooks: {
                        endpoints: webhookUrls,
                    },
                });
            }
        }

        const enableEmail =
            configService.getWebsiteConfigs<boolean>(`${prefix}ENABLE_EMAIL`) ||
            false;
        if (enableEmail) {
            channels.push({
                type: NOTIFICATION_CHANNELS.EMAIL,
                email: {
                    receivers:
                        configService.getWebsiteConfigs<string[]>(
                            `${prefix}EMAIL_TO`,
                        ) || [],
                    host:
                        configService.getWebsiteConfigs<string>(
                            `${prefix}EMAIL_HOST`,
                        ) || '',
                    port:
                        configService.getWebsiteConfigs<number>(
                            `${prefix}EMAIL_PORT`,
                        ) || 587,
                    from:
                        configService.getWebsiteConfigs<string>(
                            `${prefix}EMAIL_FROM`,
                        ) || '',
                    pass:
                        configService.getWebsiteConfigs<string>(
                            `${prefix}EMAIL_PASS`,
                        ) || '',
                },
            });
        }

        const enableSms =
            configService.getWebsiteConfigs<boolean>(`${prefix}ENABLE_SMS`) ||
            false;
        if (enableSms) {
            channels.push({
                type: NOTIFICATION_CHANNELS.SMS,
                sms: {
                    receivers:
                        configService.getWebsiteConfigs<string[]>(
                            `${prefix}SMS_RECEIVER_NUMBER`,
                        ) || [],
                    accountSid:
                        configService.getWebsiteConfigs<string>(
                            `${prefix}TWILIO_ACCOUNT_SID`,
                        ) || '',
                    authToken:
                        configService.getWebsiteConfigs<string>(
                            `${prefix}TWILIO_AUTH_TOKEN`,
                        ) || '',
                    phoneNumber:
                        configService.getWebsiteConfigs<string>(
                            `${prefix}TWILIO_PHONE_NUMBER`,
                        ) || '',
                },
            });
        }

        const queueTypes =
            configService.getWebsiteConfigs<QUEUE_TYPE[]>(
                `${prefix}QUEUE_TYPE`,
            ) || [];
        if (queueTypes.length > 0) {
            channels.push({
                type: NOTIFICATION_CHANNELS.QUEUE,
                queues: {
                    rabbitmq: queueTypes.includes(QUEUE_TYPES.RABBITMQ),
                    rabbitmqBroker: configService.getWebsiteConfigs<string>(
                        `${prefix}RABBITMQ_BROKER`,
                    ),
                    kafka: queueTypes.includes(QUEUE_TYPES.KAFKA),
                    kafkaBroker: configService.getWebsiteConfigs<string>(
                        `${prefix}KAFKA_BROKER`,
                    ),
                },
            });
        }

        const hostType =
            configService.getWebsiteConfigs<HOST_TYPE>(
                `${prefix}HOST_PROVIDER`,
            ) || HOST_TYPES.AWS;
        const config: Config = {
            timezone:
                configService.getWebsiteConfigs<string>('TIMEZONE') ||
                DEFAULT_TIMEZONE,
            websiteId: id,
            websiteName:
                configService.getWebsiteConfigs<string>(
                    `${prefix}WEBSITE_NAME`,
                ) || `Website ${id}`,
            websiteUrl: URL_REGEX_PATTERN.test(
                configService.getWebsiteConfigs<string>(
                    `${prefix}WEBSITE_URL`,
                ) || '',
            )
                ? configService.getWebsiteConfigs<string>(
                      `${prefix}WEBSITE_URL`,
                  )!
                : '',
            instanceId:
                configService.getWebsiteConfigs<string>(
                    `${prefix}INSTANCE_ID`,
                ) || `host-${id}`,
            apiRetryAttempts: configService.get('API_RETRY_ATTEMPTS') || 2,
            websiteDowntimeThreshold:
                configService.get('WEBSITE_DOWNTIME_THRESHOLD') || 60000,
            maxRestartAttempts: configService.get('HOST_RESTART_ATTEMPTS') || 2,
            hostStartupThreshold:
                configService.get('HOST_STARTUP_THRESHOLD') || 120000,
            host,
            channels,
        };

        switch (hostType) {
            case HOST_TYPES.AWS:
                config.host.hostType = HOST_TYPES.AWS;
                config.host.awsConfig = {
                    accessKeyId:
                        configService.getWebsiteConfigs<string>(
                            `${prefix}AWS_ACCESS_KEY_ID`,
                        ) || '',
                    secretAccessKey:
                        configService.getWebsiteConfigs<string>(
                            `${prefix}AWS_SECRET_ACCESS_KEY`,
                        ) || '',
                    region:
                        configService.getWebsiteConfigs<string>(
                            `${prefix}AWS_REGION`,
                        ) || '',
                };
                break;

            case HOST_TYPES.GCP:
                config.host.hostType = HOST_TYPES.GCP;
                config.host.gcpConfig = {
                    projectId:
                        configService.getWebsiteConfigs<string>(
                            `${prefix}GCP_PROJECT_ID`,
                        ) || '',
                    clientEmail:
                        configService.getWebsiteConfigs<string>(
                            `${prefix}GCP_CLIENT_EMAIL`,
                        ) || '',
                    privateKey:
                        configService.getWebsiteConfigs<string>(
                            `${prefix}GCP_PRIVATE_KEY`,
                        ) || '',
                    zone:
                        configService.getWebsiteConfigs<string>(
                            `${prefix}GCP_ZONE`,
                        ) || '',
                };
                break;

            case HOST_TYPES.AZURE:
                config.host.hostType = HOST_TYPES.AZURE;
                config.host.azureConfig = {
                    tenantId:
                        configService.getWebsiteConfigs<string>(
                            `${prefix}AZ_TENANT_ID`,
                        ) || '',
                    clientId:
                        configService.getWebsiteConfigs<string>(
                            `${prefix}AZ_CLIENT_ID`,
                        ) || '',
                    clientSecret:
                        configService.getWebsiteConfigs<string>(
                            `${prefix}AZ_CLIENT_SECRET`,
                        ) || '',
                    subscriptionId:
                        configService.getWebsiteConfigs<string>(
                            `${prefix}AZ_SUBSCRIPTION_ID`,
                        ) || '',
                    resourceGroupName:
                        configService.getWebsiteConfigs<string>(
                            `${prefix}AZ_RESOURCE_GROUPNAME`,
                        ) || '',
                };
                break;

            case HOST_TYPES.OCI:
                config.host.hostType = HOST_TYPES.OCI;
                config.host.ociConfig = {
                    tenancyId:
                        configService.getWebsiteConfigs<string>(
                            `${prefix}OCI_TENANCY_ID`,
                        ) || '',
                    userId:
                        configService.getWebsiteConfigs<string>(
                            `${prefix}OCI_USER_ID`,
                        ) || '',
                    keyFingerprint:
                        configService.getWebsiteConfigs<string>(
                            `${prefix}OCI_KEY_FINGERPRINT`,
                        ) || '',
                    privateKey:
                        configService.getWebsiteConfigs<string>(
                            `${prefix}OCI_PRIVATE_KEY`,
                        ) || '',
                    region:
                        configService.getWebsiteConfigs<string>(
                            `${prefix}OCI_REGION`,
                        ) || '',
                };
                break;

            case HOST_TYPES.CUSTOM:
                config.host.hostType = HOST_TYPES.CUSTOM;
                config.host.customConfig = {
                    restartCommand:
                        configService.getWebsiteConfigs<string>(
                            `${prefix}CUSTOM_RESTART_COMMAND`,
                        ) || '',
                    checkTransitionalStatusCommand:
                        configService.getWebsiteConfigs<string>(
                            `${prefix}CUSTOM_CHECK_TRANSITIONAL_STATUS_COMMAND`,
                        ) || '',
                };
                break;

            default:
                throw new Error(`Unsupported host type: ${hostType}`);
        }

        configs.push(config);
    });

    return configs;
};
