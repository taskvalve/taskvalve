import { IQueue } from './interface.ts'
import { ICrypto } from '../crypto.ts'
import { IModel } from '../model/interface.ts'

import { Client } from "https://deno.land/x/mysql/mod.ts";

import * as base64 from 'https://deno.land/std@0.202.0/encoding/base64.ts'
import * as uuid from "https://deno.land/std@0.202.0/uuid/mod.ts"

import { command } from './command.ts'

export class MySQL implements IQueue {
    constructor(
        private crypto: ICrypto,
        private model: IModel,
        private hostname: string,
        private port: any = 3306,
        private db: string,
        private username: string,
        private password: string,
        public connection: string = 'redis',
        public queue: string = 'default'
    ) {}

    async push(workflowId: number): Promise<void> {
        const client = await new Client().connect({
            hostname: this.hostname,
            port: parseInt(this.port),
            username: this.username,
            db: this.db,
            password: this.password
        })

        const { iv, data, mac } = await this.crypto.encrypt(command({
            id: workflowId,
            databaseConnection: this.model.connection,
            queueConnection: this.connection,
            queue: this.queue,
            storedWorkflowClass: this.model.storedWorkflowClass
        }))

        const job = {
            uuid: uuid.v1.generate(),
            displayName: "Workflow\\Signal",
            job: "Illuminate\\Queue\\CallQueuedHandler@call",
            maxTries: 1,
            maxExceptions: 1,
            failOnTimeout: false,
            backoff: null,
            timeout: null,
            retryUntil: null,
            data: {
                commandName: "Workflow\\Signal",
                command: base64.encode(JSON.stringify({
                    iv: iv,
                    value: data,
                    mac: mac,
                    tag: '',
                }))
            },
        }

        await client.execute(
            `INSERT INTO jobs(queue, payload, attempts, available_at, created_at) VALUES(?, ?, ?, ?, ?)`,
            [this.queue, JSON.stringify(job), 0, new Date().getTime() / 1000, new Date().getTime() / 1000]
        )
    }
}
