export interface Processor<TInput, TOutput> {
    execute(
        input: TInput,
        config?: unknown,
        eventName?: string,
    ): Promise<TOutput>;
}
