import { Raven } from '../raven';
import Source, { ISourceMessage } from '../source';
export interface IXHRMessage extends ISourceMessage {
    payload: {
        action?: string;
        method: string;
        url: string;
        status_code?: string;
        duration?: number;
    };
}
declare const _default: (raven: Raven) => Source<IXHRMessage>;
export default _default;
