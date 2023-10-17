import { IQueue } from './queue/interface.ts'

export class WorkflowStub {
    constructor(
        private queue: IQueue
    ) {}

    async signal(workflowId: number, method: string, args: any[]): Promise<void> {
        await this.queue.push(workflowId, method, args)
    }

    async start(workflowClass: string, args: any[]): Promise<number> {
        return await this.queue.start(workflowClass, args)
    }
}
