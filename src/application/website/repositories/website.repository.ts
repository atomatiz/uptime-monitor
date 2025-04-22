export abstract class WebsiteRepository {
    abstract trackWebsite(url: string, timeout: number): Promise<boolean>;
}
