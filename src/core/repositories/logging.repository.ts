export abstract class LoggingRepository {
    abstract log(message: any, meta?: any[]): void;
    abstract info(message: any, meta?: any[]): void;
    abstract error(message: any, meta?: any[]): void;
    abstract warn(message: any, meta?: any[]): void;
    abstract debug(message: any, meta?: any[]): void;
}
