import { IModel } from './model/interface.ts'
import { IQueue } from './queue/interface.ts'

export class WorkflowStub {
    constructor(
        private model: IModel,
        private queue: IQueue
    ) {}

    static make(workflowStub: { model: IModel, queue: IQueue }): WorkflowStub {
        return new WorkflowStub(workflowStub.model, workflowStub.queue)
    }

    async signal(workflowId: number, method: string, args: any[]): Promise<void> {
        await this.model.insert(workflowId, method, args)
        await this.queue.push(workflowId)
    }
}
