export interface IQueue {
    connection: string
    queue: string
    start(workflowClass: string, args: any[]): Promise<number>
    push(workflowId: number, method: string, args: any[]): Promise<void>
}
