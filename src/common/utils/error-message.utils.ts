export const errorMessage = (message: string, error?: unknown): string => {
    return error
        ? `${message}: ${error instanceof Error ? error.stack : JSON.stringify(error)}`
        : message;
};
