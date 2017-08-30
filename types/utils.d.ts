/**
 * Polyfill a method
 * @param obj object e.g. `document`
 * @param name method name present on object e.g. `addEventListener`
 * @param replacement replacement function
 * @param track {optional} record instrumentation to an array
 */
export declare function fill(obj: any, name: any, replacement: any, track?: any): void;
export interface IElementSerialization {
    tag: string;
    class?: string[];
    id?: string;
    data?: {
        [key: string]: string;
    };
}
export declare function serializeDOMElement(dom: HTMLElement): IElementSerialization;
/**
 * Given a child DOM element, returns a query-selector statement describing that
 * and its ancestors
 * e.g. [HTMLElement] => body > div > input#foo.btn[name=baz]
 * @param elem
 * @returns {string}
 */
export declare function htmlTreeAsString(elem: any): string;
/**
* Returns a simple, query-selector representation of a DOM element
* e.g. [HTMLElement] => input#foo.btn[name=baz]
* @param HTMLElement
* @returns {string}
*/
export declare function htmlElementAsString(elem: any): string;
/**
 * hasKey, a better form of hasOwnProperty
 * Example: hasKey(MainHostObject, property) === true/false
 *
 * @param {Object} host object to check property
 * @param {string} key to check
 */
export declare function hasKey(object: any, key: any): any;
export declare function merge(target: any, source: any): any;
export declare function isString(raw: any): boolean;
export declare function isNull(raw: any): boolean;
export declare function isUndefined(raw: any): boolean;
export declare function isObject(raw: any): boolean;
export declare function isError(raw: any): boolean;
export declare function isNil(raw: any): boolean;
export declare function isFunction(raw: any): any;
export declare function isArray(raw: any): number;
export declare function clone(raw: any): any;
