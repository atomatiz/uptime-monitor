import { Nullable } from '@common/types';

export default function sanitizeCommand(command: string): Nullable<string> {
    const dangerousPatterns = /[;&|](?=(?:[^"]*"[^"]*")*[^"]*$)/g;
    const injectionPatterns = /(\bexec\b|\beval\b|\bsh\b|\bbash\b)/i;

    if (dangerousPatterns.test(command)) {
        return null;
    }

    if (injectionPatterns.test(command)) {
        return null;
    }

    if (command.length > 500 || command.trim() === '') {
        return null;
    }

    return command.trim();
}
