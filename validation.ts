import * as https from 'https';
import * as fs from 'fs/promises';
import * as yaml from 'js-yaml';

interface YarnConfig {
    npmRegistries?: {
        [key: string]: {
            npmAuthToken?: string;
        };
    };
}

async function checkToken(): Promise<void> {
    try {
        let yarnrc: string;
        try {
            yarnrc = await fs.readFile('.yarnrc.yml', 'utf8');
        } catch (error: unknown) {
            await tryEnvToken();
            return;
        }

        const config: YarnConfig = yaml.load(yarnrc) as YarnConfig;
        const registryConfig =
            config?.npmRegistries?.['//registry.yarnpkg.com'] ||
            config?.npmRegistries?.['https://registry.yarnpkg.com'];
        const token: string | undefined = registryConfig?.npmAuthToken;

        if (!token) {
            await tryEnvToken();
            return;
        }

        let finalToken = token;
        if (token === '${YARN_TOKEN}') {
            const envToken = process.env.YARN_TOKEN;
            if (!envToken) {
                console.error('YARN_TOKEN is unset.');
                process.exit(1);
            }
            finalToken = envToken;
        }
        await validateToken(finalToken);
    } catch (error: unknown) {
        console.error(`Yarn token validation failed.`);
        process.exit(1);
    }
}

async function tryEnvToken(): Promise<void> {
    const envToken = process.env.YARN_TOKEN;
    if (!envToken) process.exit(1);
    await validateToken(envToken);
}

async function validateToken(token: string): Promise<void> {
    const options: https.RequestOptions = {
        hostname: 'registry.yarnpkg.com',
        path: '/-/whoami',
        method: 'GET',
        headers: { Authorization: `Bearer ${token}` },
    };

    await new Promise<void>((resolve, reject) => {
        const req = https.request(options, (res) => {
            let data = '';
            res.on('data', (chunk) => {
                data += chunk;
            });
            res.on('end', () => {
                if (res.statusCode === 200) {
                    resolve();
                } else {
                    console.error(`Invalid Yarn token.`);
                    reject(new Error(`Invalid token: ${data}`));
                }
            });
        });

        req.setTimeout(5000, () => {
            req.destroy();
            reject(new Error('Request timed out'));
        });

        req.on('error', (error: unknown) => {
            const msg = `Validation request failed: ${error instanceof Error ? error.message : ''}`;
            console.error(msg);
            reject(msg);
        });

        req.end();
    });
}

checkToken().catch(() => process.exit(1));
