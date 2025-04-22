import { URL_REGEX_PATTERN } from '@common/constants';
import { ValueObject } from '@domain/value-object';

interface WebsiteUrlProps {
    value: string;
}

export class WebsiteUrl extends ValueObject<WebsiteUrlProps> {
    private constructor(props: WebsiteUrlProps) {
        super(props);
    }

    get value(): string {
        return this.props.value;
    }

    public static create(url: string): WebsiteUrl {
        if (!url) {
            throw new Error('Website URL cannot be empty');
        }

        if (!URL_REGEX_PATTERN.test(url)) {
            throw new Error('Invalid URL format');
        }

        try {
            new URL(url);
        } catch {
            throw new Error('Invalid URL format');
        }

        return new WebsiteUrl({ value: url });
    }

    public toString(): string {
        return this.props.value;
    }
}
