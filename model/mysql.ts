import { IModel } from './interface.ts'
import { ICrypto } from '../crypto.ts'

import { Client } from "https://deno.land/x/mysql/mod.ts"

import { serializeClosure } from './serializeClosure.ts'

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

    async create(workflowClass: string, args: any[]): Promise<number> {
        const client = await new Client().connect({
            hostname: this.hostname,
            port: parseInt(this.port),
            username: this.username,
            db: this.db,
            password: this.password
        });

        const results = await client.execute(
            `INSERT INTO workflows(class, arguments, status) VALUES(?, ?, ?)`,
            [workflowClass, await serializeClosure(this.crypto, args), 'created']
        )

        await client.close()

        return results.lastInsertId
    }

    async insert(workflowId: number, method: string, args: any[]): Promise<void> {

        const client = await new Client().connect({
            hostname: this.hostname,
            port: parseInt(this.port),
            username: this.username,
            db: this.db,
            password: this.password
        })

        await client.execute(
            `INSERT INTO workflow_signals(stored_workflow_id, method, arguments) VALUES(?, ?, ?)`,
            [workflowId, method, await serializeClosure(this.crypto, args)]
        )

        await client.close()
    }
}
