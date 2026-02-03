export const storage = {
    get: <T>(key: string): T | null => {
        const data = localStorage.getItem(key);
        return data ? JSON.parse(data) : null;
    },
    set: <T>(key: string, value: T): void => {
        localStorage.setItem(key, JSON.stringify(value));
    },
    remove: (key: string): void => {
        localStorage.removeItem(key);
    },
    clear: (): void => {
        localStorage.clear();
    },
};

// Delay to simulate API call latency for realistic UI feedback
export const delay = (ms: number = 300) => new Promise((resolve) => setTimeout(resolve, ms));
