export class WebsiteMapper {
    static toDomain(persistenceModel: any): boolean {
        return persistenceModel;
    }

    static toPersistence(website: any): boolean {
        return website;
    }
}
