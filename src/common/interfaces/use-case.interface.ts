export interface UseCase<TInput, TOutput> {
    execute(
        input: TInput,
        config?: unknown,
        eventName?: string,
    ): Promise<TOutput>;
}
