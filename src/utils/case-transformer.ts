/**
 * Utility to convert snake_case keys to camelCase keys for frontend usability
 * while keeping the backend data consistent with the database.
 */

export const toCamel = (obj: any): any => {
    if (Array.isArray(obj)) {
        return obj.map(v => toCamel(v));
    } else if (obj !== null && obj.constructor === Object) {
        return Object.keys(obj).reduce(
            (result, key) => ({
                ...result,
                [key.replace(/(_\w)/g, k => k[1].toUpperCase())]: toCamel(obj[key]),
            }),
            {},
        );
    }
    return obj;
};

export const toSnake = (obj: any): any => {
    if (Array.isArray(obj)) {
        return obj.map(v => toSnake(v));
    } else if (obj !== null && obj.constructor === Object) {
        return Object.keys(obj).reduce(
            (result, key) => ({
                ...result,
                [key.replace(/[A-Z]/g, k => `_${k.toLowerCase()}`)]: toSnake(obj[key]),
            }),
            {},
        );
    }
    return obj;
};
