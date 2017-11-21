import { Store } from './store';
import { IMessage } from './messages-store';
import { ISourceMessage } from './source';
export declare type Callback = (error?: Error, reason?: any) => void;
export declare type TransferFunc = (data?: any, callback?: Callback) => void;
export default class Transfer {
    name: string;
    transfer?: TransferFunc;
    configStore: Store;
    queue: TransferFunc[];
    running: boolean;
    constructor(name: string, transferFunc?: TransferFunc);
    config(key: string, value: string): any;
    config(object: any): any;
    send(message: IMessage): void;
    extendMessage(message: ISourceMessage): ISourceMessage;
    run(): void;
}
