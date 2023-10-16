export interface IQueue {
    connection: string
    queue: string
    push(workflowId: number, method: string, args: any[]): Promise<void>
}
