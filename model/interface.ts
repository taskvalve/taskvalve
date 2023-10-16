export interface IModel {
    connection: string;
    storedWorkflowClass: string;
    insert(storedWorkflowId: number, method: string, args: any[]): Promise<void>;
}
