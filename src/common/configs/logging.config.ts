import { Format } from 'logform';
import { format } from 'winston';
import { inspect } from 'util';
import safeStringify from 'fast-safe-stringify';

const appName = process.env.APP_NAME ?? 'Uptime Monitor';

const clc = {
    bold: (text: string) => `\x1B[1m${text}\x1B[0m`,
    green: (text: string) => `\x1B[32m${text}\x1B[39m`,
    yellow: (text: string) => `\x1B[33m${text}\x1B[39m`,
    red: (text: string) => `\x1B[31m${text}\x1B[39m`,
    magentaBright: (text: string) => `\x1B[95m${text}\x1B[39m`,
    cyanBright: (text: string) => `\x1B[96m${text}\x1B[39m`,
};

const nestLikeColorScheme: Record<string, (text: string) => string> = {
    info: clc.green,
    error: clc.red,
    warn: clc.yellow,
    debug: clc.magentaBright,
    verbose: clc.cyanBright,
};

const nestLikeConsoleFormat = (
    options = {
        colors: true,
        prettyPrint: true,
    },
): Format =>
    format.printf(({ context, level, timestamp, message, ms, ...meta }) => {
        const color =
            (options.colors && nestLikeColorScheme[level]) ||
            ((text: string): string => text);
        const yellow = options.colors
            ? clc.yellow
            : (text: string): string => text;

        const stringifiedMeta = safeStringify(meta);
        const formattedMeta = options.prettyPrint
            ? inspect(JSON.parse(stringifiedMeta), {
                  colors: options.colors,
                  depth: null,
              })
            : stringifiedMeta;

        return (
            `${color(`[${appName}]`)} ` +
            `${yellow(`[${level.charAt(0).toUpperCase() + level.slice(1)}]`)}\t` +
            ('undefined' !== typeof timestamp
                ? `${timestamp as string | number} `
                : '') +
            ('undefined' !== typeof context
                ? `${yellow(`[${context as string}]`)} `
                : '') +
            `=> ` +
            `${color(message as string)} - ` +
            `${formattedMeta}` +
            ('undefined' !== typeof ms ? ` ${yellow(ms as string)}` : '')
        );
    });

export const utilities = {
    format: {
        nestLike: nestLikeConsoleFormat,
    },
};
