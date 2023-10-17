import { IModel } from './interface.ts'
import { ICrypto } from '../crypto.ts'

import { Client } from "https://deno.land/x/postgres/mod.ts"

import { serializeClosure } from './serializeClosure.ts'

export class PostgreSQL implements IModel {
    constructor(
        private crypto: ICrypto,
        private hostname: string,
        private port: any = 5432,
        private db: string,
        private user: string,
        private password: string,
        public connection: string = 'pgsql',
        public storedWorkflowClass: string = 'Workflow\\Models\\StoredWorkflow',
    ) {}

    async create(workflowClass: string, args: any[]): Promise<number> {
        const client = new Client({
            hostname: this.hostname,
            port: parseInt(this.port),
            user: this.user,
            database: this.db,
            password: this.password,
        })

        await client.connect()

        const results = await client.queryObject(
            `INSERT INTO workflows(class, arguments, status) VALUES($1, $2, $3) RETURNING id`,
            [workflowClass, await serializeClosure(this.crypto, args), 'created']
        )

        await client.end()

        return Number(results.rows[0].id)
    }

    async insert(workflowId: number, method: string, args: any[]): Promise<void> {
        const client = new Client({
            hostname: this.hostname,
            port: parseInt(this.port),
            user: this.user,
            database: this.db,
            password: this.password,
        })

        await client.connect()

        await client.queryObject(
            `INSERT INTO workflow_signals(stored_workflow_id, method, arguments) VALUES($1, $2, $3)`,
            [workflowId, method, await serializeClosure(this.crypto, args)]
        )

        await client.end()
    }
}
