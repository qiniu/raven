export declare type SourceMessageType = 'message' | 'error';
export interface ISourceMessage {
    url?: string;
    type?: SourceMessageType;
    category: string;
    payload: any;
    timestamp?: number;
    user?: any;
    tags?: any;
    extra?: any;
}
export declare type ActionFunc<T> = (message: T) => any;
export declare type ProcessorFunc<T> = (actionFunc: ActionFunc<T>) => any;
export default class Source<T> {
    name: string;
    processor: ProcessorFunc<T>;
    receivers: ActionFunc<T>[];
    /**
     * Class Source
     * @param {string} name Name of the source to identify
     * @param {function} processorFunc The processing function of the source
     *
     * @example
     * new Source((action) => {
     *   whenSomethingHappen((value) => {
     *     action({
     *       category: 'something',
     *       payload: value
     *     })
     *   })
     * })
     */
    constructor(name: string, processorFunc: ProcessorFunc<T>);
    /**
     * Fire the message to raven
     * @param {ISourceMessage} message
     */
    action(message: ISourceMessage): void;
    /**
     * bind the message event (only call by raven internally)
     * @param callback
     */
    onAction(callback: ActionFunc<T>): void;
    /**
     * Dispose the source (only call by raven internally)
     */
    dispose(): void;
}
