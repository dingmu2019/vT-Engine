export class AppError extends Error {
    constructor(
        public statusCode: number,
        public code: string,
        public message: string,
        public details?: any
    ) {
        super(message);
        Object.setPrototypeOf(this, AppError.prototype);
    }
}

