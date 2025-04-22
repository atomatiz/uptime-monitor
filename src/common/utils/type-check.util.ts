export function hasAnyKey<T>(obj: any, keys: (keyof T)[]): obj is Partial<T> {
    return (
        obj !== null &&
        typeof obj === 'object' &&
        keys.some((key) => key in obj)
    );
}
