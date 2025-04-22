export interface IHttpResponse {
    statusCode: number;
    statusText: string;
    data?: any;
}

export interface IHttpClient {
    getFullResponse(url: string, timeout: number): Promise<IHttpResponse>;
}
