import { Nullable } from '@common/types';

const discordPattern =
    /^https:\/\/discord\.com\/api\/webhooks\/\d{17,19}\/[a-zA-Z0-9_-]{68}$/;

const slackPattern =
    /^https:\/\/hooks\.slack\.com\/services\/T[A-Z0-9]{8,12}\/B[A-Z0-9]{8,12}\/[a-zA-Z0-9]{24}$/;

const teamsPattern =
    /^https:\/\/.*\.webhook\.office\.com\/webhookb2\/[a-zA-Z0-9-]+\/IncomingWebhook\/[a-zA-Z0-9]+\/[a-zA-Z0-9-]+$/;

export const getWebhookType = (
    url: string,
): Nullable<'discord' | 'slack' | 'teams'> => {
    url = url.trim();

    if (discordPattern.test(url)) {
        return 'discord';
    }
    if (slackPattern.test(url)) {
        return 'slack';
    }
    if (teamsPattern.test(url)) {
        return 'teams';
    }

    return null;
};
