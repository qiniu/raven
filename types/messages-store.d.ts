import { CollectionStore } from './store';
import { ISourceMessage } from './source';
import { Raven } from './raven';
export interface IMessage {
    id: number;
    data: ISourceMessage;
    sent: boolean;
}
export declare class MessagesStore {
    counter: number;
    parent: Raven;
    store: CollectionStore<IMessage>;
    constructor(parent: Raven);
    add(data: ISourceMessage): void;
}
