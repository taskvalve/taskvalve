export function serialize(value: any) {
    if (value === null) {
        return 'N';
    }
    if (typeof value === 'boolean') {
        return value ? 'b:1;' : 'b:0;';
    }
    if (typeof value === 'number') {
        if (Number.isInteger(value)) {
            return `i:${value};`;
        } else {
            return `d:${value};`;
        }
    }
    if (typeof value === 'string') {
        const byteLength = new TextEncoder().encode(value).length;
        return `s:${byteLength}:"${value}";`;
    }
    if (Array.isArray(value)) {
        const serializedArray = value.map((val, index) => `${serialize(index)}${serialize(val)}`).join('');
        return `a:${value.length}:{${serializedArray}}`;
    }
    const serializedObj = Object.entries(value)
        .map(([key, val]) => `${serialize(key)}${serialize(val)}`)
        .join('');
    return `a:${Object.keys(value).length}:{${serializedObj}}`;
}
