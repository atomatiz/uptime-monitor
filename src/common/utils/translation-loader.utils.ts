import { join } from 'path';
import { readFileSync, existsSync } from 'fs';

const lang = process.env.LANG_CODE || 'en';

const possiblePaths = [
    // Check in dist directory first (for production)
    join(
        __dirname,
        '..',
        '..',
        'resources',
        'localization',
        lang,
        'translations.json',
    ),
    // Check in src directory (for development)
    join(
        process.cwd(),
        'src',
        'resources',
        'localization',
        lang,
        'translations.json',
    ),
    // Fallback to English if specified language not found
    join(
        process.cwd(),
        'src',
        'resources',
        'localization',
        'en',
        'translations.json',
    ),
];

let translations = {};
for (const path of possiblePaths) {
    if (existsSync(path)) {
        try {
            translations = JSON.parse(readFileSync(path, 'utf-8'));
            break;
        } catch (error: unknown) {
            console.error(`Error loading translations from ${path}:`, error);
        }
    }
}

export default translations;
