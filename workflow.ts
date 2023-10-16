import { IQueue } from './queue/interface.ts'

export class WorkflowStub {
    constructor(
        private queue: IQueue
    ) {}

    async signal(workflowId: number, method: string, args: any[]): Promise<void> {
        await this.queue.push(workflowId, method, args)
    }
}
