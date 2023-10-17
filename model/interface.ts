export interface IModel {
    connection: string
    storedWorkflowClass: string
    create(workflowClass: string, args: any[]): Promise<number>
    insert(workflowId: number, method: string, args: any[]): Promise<void>
}
