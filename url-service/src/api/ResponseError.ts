export class ResponseError extends Error {
    public statusCode: number
    public internalMessage: string
    constructor(internalMessage: string, message: string, statusCode: number) {
        super(message)
        this.internalMessage = internalMessage
        this.statusCode = statusCode
    }
}

export class Response500Error extends ResponseError {
    constructor(internalMessage?: string) {
        super(internalMessage, 'Internal Server Error', 500)
    }
}

export class Response404Error extends ResponseError {
    constructor(internalMessage?: string) {
        super(internalMessage, 'Resource not found', 404)
    }
}

export class Response403Error extends ResponseError {
    constructor(internalMessage?: string) {
        super(internalMessage, 'Access denied', 403)
    }
}