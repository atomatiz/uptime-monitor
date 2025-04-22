export interface HttpCacheInterceptorOptions {
    excludePaths?: string[];
    ttl?: number;
    max?: number;
}

export interface Response<T> {
    statusCode?: number;
    message?: string;
    data: T;
}
