export class NotificationMapper {
    static toDomain(persistenceModel: any): any {
        return persistenceModel;
    }

    static toPersistence(notification: any): any {
        return notification;
    }
}
