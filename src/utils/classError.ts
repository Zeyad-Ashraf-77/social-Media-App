export class AppError extends Error {
    constructor(message:string, cause:number) {
        super(message);
        this.cause = cause;
    }
}