import { IModel } from './interface.ts'
import { ICrypto } from '../crypto.ts'

import { Client } from "https://deno.land/x/mysql/mod.ts";

import { serialize } from '../serialize.ts'

export class MySQL implements IModel {
    constructor(
        private crypto: ICrypto,
        private hostname: string,
        private port: any = 3306,
        private db: string,
        private username: string,
        private password: string,
        public connection: string = 'mysql',
        public storedWorkflowClass: string = 'Workflow\\Models\\StoredWorkflow',
    ) {}

    async insert(storedWorkflowId: number, method: string, args: any[]): Promise<void> {
        let template = "O:46:\"Laravel\\SerializableClosure\\Serializers\\Native\":5:{s:3:\"use\";a:1:{s:4:\"data\";a:1:{i:0;b:1;}}s:8:\"function\";s:21:\"static fn () => $data\";s:5:\"scope\";s:22:\"Workflow\\Serializers\\Y\";s:4:\"this\";N;s:4:\"self\";s:32:\"00000000000000000000000000000000\";}"

        const client = await new Client().connect({
            hostname: this.hostname,
            port: parseInt(this.port),
            username: this.username,
            db: this.db,
            password: this.password
        });

        const serialized = serialize(args)
        const serializedArgs = template.replace(/s:4:"data";a:\d+:\{[^}]+\}/, `s:4:"data";${serialized}`);
        const hash = await this.crypto.hmac(serializedArgs)

        const encoder = new TextEncoder();
        const argsLength = encoder.encode(serializedArgs).length;
        const hashLength = encoder.encode(hash).length;

        let serializedclosure = `O:47:"Laravel\\SerializableClosure\\SerializableClosure":1:{s:12:"serializable";O:46:"Laravel\\SerializableClosure\\Serializers\\Signed":2:{s:12:"serializable";s:${argsLength}:"${serializedArgs}";s:4:"hash";s:${hashLength}:"${hash}";}}`;

        await client.execute(
            `INSERT INTO workflow_signals(stored_workflow_id, method, arguments) VALUES(?, ?, ?)`,
            [storedWorkflowId, method, serializedclosure]
        );

        await client.close();
    }
}
