export declare type ValidKeyType = string | symbol;
export declare type ValidValueType = string | number | symbol | boolean | any[] | any;
export declare class Storage {
    data: {
        [key: string]: ValidValueType;
    };
    setItem(key: ValidKeyType, value: ValidValueType): void;
    getItem(key: ValidKeyType): any;
    removeItem(key: ValidKeyType): void;
    clear(): void;
}
export declare class Store {
    type: typeof Store;
    _storage?: any;
    name: string;
    keys: ValidKeyType[];
    constructor(name: string);
    static bindRealStorage(storage: any): void;
    readonly storage: any;
    set(key: ValidKeyType, value: ValidValueType): any;
    get(key: ValidKeyType): any;
    has(key: ValidKeyType): boolean;
    remove(key: ValidKeyType): void;
    clear(): void;
    merge(source: any): void;
    toJS(): any;
}
export declare class CollectionStore<T> extends Store {
    type: typeof CollectionStore;
    readonly length: number;
    collect(): T[];
    push(item: T): number;
    pop(): T;
    shift(): T;
    unshift(item: T): number;
    _update(collection: any): void;
}
