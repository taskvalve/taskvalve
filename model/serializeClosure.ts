function serialize(value: any) {
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

export async function serializeClosure(crypto: any, args: any): Promise<string> {
    const template = "O:46:\"Laravel\\SerializableClosure\\Serializers\\Native\":5:{s:3:\"use\";a:1:{s:4:\"data\";a:1:{i:0;b:1;}}s:8:\"function\";s:21:\"static fn () => $data\";s:5:\"scope\";s:22:\"Workflow\\Serializers\\Y\";s:4:\"this\";N;s:4:\"self\";s:32:\"00000000000000000000000000000000\";}";

    const serialized = serialize(args);

    const serializedArgs = template.replace(/s:4:"data";a:\d+:\{[^}]+\}/, `s:4:"data";${serialized}`);
    const hash = await crypto.hmac(serializedArgs);

    const encoder = new TextEncoder();
    const argsLength = encoder.encode(serializedArgs).length;
    const hashLength = encoder.encode(hash).length;

    return `O:47:"Laravel\\SerializableClosure\\SerializableClosure":1:{s:12:"serializable";O:46:"Laravel\\SerializableClosure\\Serializers\\Signed":2:{s:12:"serializable";s:${argsLength}:"${serializedArgs}";s:4:"hash";s:${hashLength}:"${hash}";}}`;
}
