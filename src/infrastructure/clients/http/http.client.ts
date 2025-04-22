import { Injectable, Optional } from '@nestjs/common';
import {
    IHttpClient,
    IHttpResponse,
} from '@common/domains/website/interfaces/http-client.interface';
import axios, { AxiosInstance } from 'axios';
import { errorMessage } from '@common/utils/error-message.utils';
import { HTTP_STATUS_CODES } from '@common/constants/http.constants';
import { ConfigurationService } from '@core/configuration.service';

@Injectable()
export class HttpClient implements IHttpClient {
    private readonly axiosInstance: AxiosInstance;

    constructor(
        @Optional() private readonly baseURL?: string,
        private readonly configService?: ConfigurationService,
    ) {
        this.axiosInstance = axios.create({
            baseURL: this.baseURL,
            headers: {
                Authorization: `Bearer ${this.configService?.get('API_TOKEN')}`,
                'Content-Type': 'application/json',
            },
            withCredentials: true,
            validateStatus: () => true,
        });
    }

    async getFullResponse(
        url: string,
        timeout: number,
    ): Promise<IHttpResponse> {
        try {
            const response = await this.axiosInstance.get(url, {
                timeout,
            });
            return {
                statusCode: response.status,
                statusText: response.statusText,
                data: response.data,
            } as IHttpResponse;
        } catch (error: unknown) {
            return {
                statusCode: HTTP_STATUS_CODES.GATEWAY_TIMEOUT,
                statusText: errorMessage(
                    errorMessage(`HTTP GET failed for ${url}`, error),
                ),
            };
        }
    }
}
