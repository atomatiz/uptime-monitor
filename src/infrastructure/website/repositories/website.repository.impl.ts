import { Injectable } from '@nestjs/common';
import { HttpClient } from '@infrastructure/clients/http/http.client';
import { LoggingService } from '@core/logging.service';
import { WebsiteRepository } from '@application/website/repositories/website.repository';
import { errorMessage } from '@common/utils';
import { HTTP_STATUS_CODES } from '@common/constants';
import { WebsiteMapper } from '../mapper/website.mapper';

@Injectable()
export class WebsiteRepositoryImpl extends WebsiteRepository {
    private readonly logger = new LoggingService(WebsiteRepositoryImpl.name);

    constructor(private readonly httpClient: HttpClient) {
        super();
    }

    /**
     * Delegates to HttpClient.getFullResponse
     * @inheritdoc
     */
    async trackWebsite(url: string, timeout: number): Promise<boolean> {
        let result: boolean;
        try {
            const response = await this.httpClient.getFullResponse(
                url,
                timeout,
            );
            if (response.statusCode !== HTTP_STATUS_CODES.OK) {
                result = false;
            } else {
                result = true;
            }
        } catch (error: unknown) {
            this.logger.error(
                errorMessage(`Failed to check website: ${url}`, error),
            );
            result = false;
        }
        return WebsiteMapper.toDomain(result);
    }
}
