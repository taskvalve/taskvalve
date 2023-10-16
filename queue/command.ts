export type CommandOptions = {
    id: number
    databaseConnection: string
    queueConnection: string
    queue: string
    storedWorkflowClass?: string
};

export function command(options: CommandOptions): string {
    let template = 's:304:"O:15:"Workflow\\Signal":3:{s:14:"storedWorkflow";O:45:"Illuminate\\Contracts\\Database\\ModelIdentifier":5:{s:5:"class";s:30:"Workflow\\Models\\StoredWorkflow";s:2:"id";i:1;s:9:"relations";a:0:{}s:10:"connection";s:5:"mysql";s:15:"collectionClass";N;}s:10:"connection";s:5:"redis";s:5:"queue";s:7:"default";}";'

    if (options.storedWorkflowClass) {
        const classPattern = /s:\d+:"Workflow\\Models\\StoredWorkflow"/
        const classReplacement = `s:${options.storedWorkflowClass.length}:"${options.storedWorkflowClass}"`
        template = template.replace(classPattern, classReplacement)
    }

    if (options.id !== undefined) {
        template = template.replace(/s:2:"id";i:\d+;/, `s:2:"id";i:${options.id};`)
    }

    if (options.databaseConnection) {
        const mysqlPattern = /s:\d+:"mysql"/
        const mysqlReplacement = `s:${options.databaseConnection.length}:"${options.databaseConnection}"`
        template = template.replace(mysqlPattern, mysqlReplacement)
    }

    if (options.queueConnection) {
        const redisPattern = /s:\d+:"redis"/
        const redisReplacement = `s:${options.queueConnection.length}:"${options.queueConnection}"`
        template = template.replace(redisPattern, redisReplacement)
    }

    if (options.queue) {
        const queuePattern = /s:\d+:"default"/
        const queueReplacement = `s:${options.queue.length}:"${options.queue}"`
        template = template.replace(queuePattern, queueReplacement)
    }

    const encoder = new TextEncoder()
    const innerStringStartIndex = template.indexOf('s:251:"') + 8
    const innerString = template.substring(innerStringStartIndex, template.length - 2)
    const lengthPattern = /s:\d+:/
    const lengthReplacement = `s:${encoder.encode(innerString).length}:`
    template = template.replace(lengthPattern, lengthReplacement)

    return template
}
