export interface IQueue {
    connection: string
    queue: string
    push(workflowId: number): Promise<void>
}
