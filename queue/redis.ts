import { IQueue } from './interface.ts'
import { ICrypto } from '../crypto.ts'
import { IModel } from '../model/interface.ts'

import { connect } from "https://deno.land/x/redis/mod.ts"
import * as base64 from 'https://deno.land/std@0.202.0/encoding/base64.ts'
import * as uuid from "https://deno.land/std@0.202.0/uuid/mod.ts"
import { cryptoRandomString } from "https://deno.land/x/crypto_random_string@1.0.0/mod.ts"

import { command } from './command.ts'

export class Redis implements IQueue {
    constructor(
        private crypto: ICrypto,
        private model: IModel,
        private hostname: string = 'redis',
        private port: number = 6379,
        public connection: string = 'redis',
        public queue: string = 'default'
    ) {}

    async start(workflowClass: string, args: any[]): Promise<number> {
        const workflowId = await this.model.create(workflowClass, args)
        await this.push(workflowId, 'currentTime', [])
        return workflowId
    }

    async push(workflowId: number, method: string, args: any[]): Promise<void> {
        await this.model.insert(workflowId, method, args)

        const redis = await connect({
            hostname: this.hostname,
            port: this.port
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
            maxTries: 0,
            maxExceptions: 0,
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
            id: cryptoRandomString({ type: 'alphanumeric', length: 32 }),
            attempts: 0
        }

        const luaScript = `
            redis.call('rpush', KEYS[1], ARGV[1])
            redis.call('rpush', KEYS[2], 1)
        `

        await redis.eval(
            luaScript,
            [
                `${this.crypto.app.toLowerCase()}_database_queues:${this.queue}`,
                `${this.crypto.app.toLowerCase()}_database_queues:${this.queue}:notify`
            ],
            [JSON.stringify(job)]
        )

        await redis.close()
    }
}
