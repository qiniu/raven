import { Store } from './store';
import { MessagesStore } from './messages-store';
import Transfer from './transfer';
import Source from './source';
import { ILogger } from './logger';
export declare type URLPattern = RegExp | string;
export interface IRavenOption {
    release?: string;
    environment?: string;
    tags?: any;
    whitelistUrls?: URLPattern[];
    ignoreUrls?: URLPattern[];
    ignoreError?: string[];
    autoInstall?: boolean;
    instrument?: boolean | {
        tryCatch?: boolean;
    };
    autoBreadcrumbs?: boolean | {
        xhr?: boolean;
        console?: boolean;
        dom?: boolean;
        history?: boolean;
    };
    transfer?: Transfer;
    transfers?: Transfer[];
    sources?: Source<any>[];
    debug?: boolean;
}
export declare type ValueCallback<T> = (value?: T, callback?: ValueCallback<T>) => T;
export declare class Raven {
    VERSION: '3.13.1';
    option: IRavenOption;
    callbacks: {
        [key: string]: ValueCallback<any>;
    };
    configStore: Store;
    contextStore: Store;
    messages: MessagesStore;
    transfers: Transfer[];
    sources: Source<any>[];
    __wrappedBuiltins: any[];
    readonly Transfer: typeof Transfer;
    readonly Source: typeof Source;
    readonly logger: ILogger;
    /**
     * Raven Constructor
     * @param option Raven Option
     */
    constructor(option?: IRavenOption);
    /**
     * getter debug
     * @return {boolean}
     */
    /**
     * setter debug
     */
    debug: boolean;
    /**
     * Install raven's instruments
     * @return {Raven}
     */
    install(): this;
    /**
     * Dispose raven
     * @return {Raven}
     */
    uninstall(): this;
    /**
     * Add new source into raven
     *
     * @param {Source} source Data source
     * @return {Raven}
     *
     * @example
     * raven.addSource(source)
     */
    addSource(source: Source<any>): this;
    /**
     * add a data transfer
     *
     * @param {Transfer} transfer Custom data transfer
     * @return {Raven}
     *
     * @example
     * raven.addTransfer(transfer)
     */
    addTransfer(transfer: Transfer): this;
    /**
     * Set single config value of raven
     *
     * @param {string} key Key of the config
     * @param {string} value Value
     * @return {Raven}
     *
     * @example
     * raven.config('foo', 'bar')
     */
    config(key: string, value: string): any;
    /**
     * Set batch of config values
     *
     * @param {Object} object Config
     * @return {Raven}
     *
     * @example
     * raven.config({
     *   'foo': 1,
     *   'bar': 2
     * })
     */
    config(object: any): any;
    /**
     * Manually capture an exception and send it over to Sentry
     *
     * @param {error} ex An exception to be logged
     * @param {object} options A specific set of options for this error [optional]
     * @return {Raven}
     *
     * @example
     * try {
     *   // stuff...
     * } catch(ex) {
     *   raven.captureException(ex)
     * }
     *
     * @example
     * stuff().catch((ex) => raven.captureException(ex))
     */
    captureException(ex: Error, options?: any): any;
    /**
     * Set a user to be sent along with the payload.
     *
     * @param {object} user An object representing user data [optional]
     * @return {Raven}
     *
     * @example
     * raven.setUserContext({
     *   uid: 123456,
     *   email: 'foobar@example.com'
     * })
     */
    setUserContext(user: any): this;
    /**
     * Merge tags to be sent along with the payload.
     *
     * @param {object} tags An object representing tags
     * @return {Raven}
     *
     * @example
     * raven.setTagsContext('tags', [ 'beta' ])
     */
    setTagsContext(tags: any): this;
    /**
     * Merge extra attributes to be sent along with the payload.
     *
     * @param {object} extra An object representing extra data [optional]
     * @return {Raven}
     */
    setExtraContext(extra: any): this;
    /**
     * Clear all of the context.
     *
     * @return {Raven}
     *
     * @example
     * raven.clearContext()
     */
    clearContext(): this;
    /**
     * Get a copy of the current context. This cannot be mutated.
     *
     * @return {object} copy of context
     */
    getContext(): any;
    /**
     * Set environment of application
     *
     * @param {string} environment Typically something like 'production'.
     * @return {Raven}
     *
     * @example
     * raven.setEnvironment('development')
     * raven.setEnvironment('production')
     */
    setEnvironment(env: string): this;
    /**
     * Set release version of application
     *
     * @param {string} release Typically something like a git SHA to identify version
     * @return {Raven}
     *
     * @example
     * raven.setRelease('public-v0.1.0')
     */
    setRelease(release: string): this;
    /**
     * Get the callback of the special point
     *
     * @param {string} key Key of callback
     * @return {ValueCallback}
     *
     * @example
     * raven.getCallback('breadcrumb')
     */
    getCallback(key: string): ValueCallback<any>;
    /**
     * Set callback of special point
     *
     * @param {string} key Key of the point
     * @param {ValueCallback} callback Callback
     *
     * @example
     * raven.setCallback('breadcrumb', (message) => {
     *   console.log(message)
     * })
     */
    setCallback(key: string, callback?: ValueCallback<any>): void;
    /**
     * Set the breadcrumb callback option
     *
     * @param {ValueCallback} callback The callback to run which some breadcrumb
     *                            message create
     * @return {Raven}
     */
    setBreadcrumbCallback(callback: ValueCallback<any>): void;
    /**
     * Set the dataCallback option
     *
     * @param {ValueCallback} callback The callback to run which some exception
     *                            message create
     * @return {Raven}
     */
    setExceptionCallback(callback: ValueCallback<any>): void;
    /**
     * Wrap code within a context and returns back a new function to be executed
     *
     * @param {object} options A specific set of options for this context [optional]
     * @param {function} func The function to be wrapped in a new context
     * @param {function} func A function to call before the try/catch wrapper [optional, private]
     * @return {function} The newly wrapped functions with a context
     */
    wrap(options: any, func?: any, _before?: any): any;
    /**
     * Wrap code within a context so Raven can capture errors
     * reliably across domains that is executed immediately.
     *
     * @param {function} func The callback to be immediately executed within the context
     * @param {array} args An array of arguments to be called with the callback [optional]
     * @param {object} options A specific set of options for this context [optional]
     */
    context(func: any, args: any[]): any;
    context(func: any, options: any): any;
    context(func: any, args: any[], options: any): any;
    _ignoreOnError: number;
    _ignoreNextOnError(): void;
    _setupBreadcrumb(): void;
    _restoreBuiltIns(): void;
}
declare const raven: Raven;
export default raven;
