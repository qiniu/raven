export interface ILogger {
    log?(message: string | any, ...args: any[]): void;
    info?(message: string | any, ...args: any[]): void;
    warn?(message: string | any, ...args: any[]): void;
    error?(message: string | Error, ...args: any[]): void;
}
declare const logger: ILogger;
export default logger;
