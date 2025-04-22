export interface IScheduling<T = void> {
    main(): Promise<T>;
    start(): void;
}
