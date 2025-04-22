export class HostMapper {
    static toDomain(persistenceModel: any): any {
        return persistenceModel;
    }

    static toPersistence(host: any): any {
        return host;
    }
}
