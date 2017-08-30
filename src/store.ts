const stringify = JSON.stringify

export type ValidKeyType = string | symbol
export type ValidValueType = string | number | symbol | boolean | any[] | any

export class Storage {
  data: { [key: string]: ValidValueType } = {}
  
  setItem(key: ValidKeyType, value: ValidValueType) {
    this.data[key] = value
  }

  getItem(key: ValidKeyType) {
    const value = this.data[key]

    return value
  }

  removeItem(key: ValidKeyType) {
    delete this.data[key]
  }

  clear() {
    this.data = {}
  }
}

let realStorage = null

export class Store {

  type = Store

  _storage?: any = new Storage()
  name: string
  keys: ValidKeyType[] = []

  constructor(name: string) {
    this.name = name
  }

  static bindRealStorage(storage: any) {
    realStorage = storage
  }

  get storage() {
    if (realStorage) {
      return realStorage
    } else {
      return this._storage
    }
  }

  set(key: ValidKeyType, value: ValidValueType) {
    this.storage.setItem(`${this.name}:${key}`, stringify(value))

    if (this.keys.indexOf(key) === -1) {
      this.keys.push(key)
    }

    return value
  }

  get(key: ValidKeyType) {
    const value = this.storage.getItem(`${this.name}:${key}`)
    if (value) {
      return JSON.parse(value)
    } else {
      return null
    }
  }

  has(key: ValidKeyType) {
    return this.keys.indexOf(key) >= 0
  }

  remove(key: ValidKeyType) {
    this.storage.removeItem(`${this.name}:${key}`)
    
    const index = this.keys.indexOf(key)
    if (index >= 0) {
      this.keys.splice(index, 1)
    }
  }

  clear() {
    this.storage.clear()
    this.keys = []
  }

  merge(source: any) {
    for (const key in source) {
      if (source.hasOwnProperty(key)) {
        const value = source[key]
        
        this.set(key, value)
      }
    }
  }

  toJS() {
    const object: any = {}
    
    for (const key of this.keys) {
      object[key] = this.get(key)
    }

    return object
  }
}

export class CollectionStore<T> extends Store {

  type = CollectionStore

  get length() {
    return this.collect().length
  }

  collect(): T[] {
    return this.get('collection') || []
  }

  push(item: T) {
    const current = this.collect()

    current.push(item)

    this._update(current)
    return current.length
  }

  pop() {
    const current = this.collect()
    const item = current.pop()

    this._update(current)

    return item
  }

  shift() {
    const current = this.collect()
    const item = current.shift()

    this._update(current)

    return item
  }

  unshift(item: T) {
    const current = this.collect()

    current.unshift(item)

    this._update(current)
    return current.length
  }

  _update(collection) {
    this.set('collection', collection)
    this.set('length', collection.length)
  }
}
