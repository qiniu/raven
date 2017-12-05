import { hasJSON } from './detection'

/**
 * Polyfill a method
 * @param obj object e.g. `document`
 * @param name method name present on object e.g. `addEventListener`
 * @param replacement replacement function
 * @param track {optional} record instrumentation to an array
 */
export function fill(obj, name, replacement, track?) {
  var orig = obj[name]
  obj[name] = replacement(orig)
  if (track) {
    track.push([obj, name, orig])
  }
}

export interface IElementSerialization {
  tag: string
  class?: string[]
  id?: string
  data?: {
    [key: string]: string
  }
}

const dataAttrRegex = /^data-/

export function serializeDOMElement(dom: HTMLElement) {
  const dataSet = [].slice.call(dom.attributes)
    .filter(attr => dataAttrRegex.test(attr.name))
    .map(attr => [
      attr.name.substr(5).replace(/-(.)/g, ($0, $1) => $1.toUpperCase()),
      attr.value
    ])

  const data = {}
  for (const [ key, value ] of dataSet) {
    data[key] = value
  }

  const serialization: IElementSerialization = {
    tag: dom.tagName,
    'class': dom.className !== '' ? dom.className.split(' ').filter(Boolean): null,
    id: dom.id || null,
    data
  }

  return serialization
}

const MAX_TRAVERSE_HEIGHT = 5
const MAX_OUTPUT_LEN = 80

/**
 * Given a child DOM element, returns a query-selector statement describing that
 * and its ancestors
 * e.g. [HTMLElement] => body > div > input#foo.btn[name=baz]
 * @param elem
 * @returns {string}
 */
export function htmlTreeAsString(elem) {
  /* eslint no-extra-parens:0*/
  const out = []
  const separator = ' > '
  const sepLength = separator.length
  let height = 0
  let len = 0
  let nextStr

  while (elem && height++ < MAX_TRAVERSE_HEIGHT) {

    nextStr = htmlElementAsString(elem)
    // bail out if
    // - nextStr is the 'html' element
    // - the length of the string that would be created exceeds MAX_OUTPUT_LEN
    //   (ignore this limit if we are on the first iteration)
    if (nextStr === 'html' || height > 1 && len + (out.length * sepLength) + nextStr.length >= MAX_OUTPUT_LEN) {
      break
    }

    out.push(nextStr)

    len += nextStr.length
    elem = elem.parentNode
  }

  return out.reverse().join(separator)
}

/**
* Returns a simple, query-selector representation of a DOM element
* e.g. [HTMLElement] => input#foo.btn[name=baz]
* @param HTMLElement
* @returns {string}
*/
export function htmlElementAsString(elem) {
  const out = []
  let className
  let classes
  let key
  let attr
  let i

  if (!elem || !elem.tagName) {
    return ''
  }

  out.push(elem.tagName.toLowerCase())
  if (elem.id) {
    out.push('#' + elem.id)
  }

  className = elem.className
  if (className && typeof className === 'string') {
    classes = className.split(/\s+/)
    for (i = 0; i < classes.length; i++) {
      out.push('.' + classes[i])
    }
  }
  var attrWhitelist = ['type', 'name', 'title', 'alt']
  for (i = 0; i < attrWhitelist.length; i++) {
    key = attrWhitelist[i]
    attr = elem.getAttribute(key)
    if (attr) {
      out.push('[' + key + '="' + attr + '"]')
    }
  }
  return out.join('')
}

const objectPrototype = Object.prototype

/**
 * hasKey, a better form of hasOwnProperty
 * Example: hasKey(MainHostObject, property) === true/false
 *
 * @param {Object} host object to check property
 * @param {string} key to check
 */
export function hasKey(object, key) {
  return objectPrototype.hasOwnProperty.call(object, key);
}

export function merge(target, source) {
  const obj: any = {}

  for (const key in target) { obj[key] = target[key] }
  for (const key in source) { obj[key] = source[key] }

  return obj
}

// Simple type check utils
export function isString(raw) {
  return typeof raw === 'string'
}

export function isNull(raw) {
  return raw === null
}

export function isUndefined(raw) {
  return raw === void 0
}

export function isObject(raw) {
  return typeof raw === 'object'
}

export function isError(raw) {
  return raw instanceof Error
}

export function isNil(raw) {
  return isNull(raw) || isUndefined(raw)
}

export function isFunction(raw) {
  return typeof raw === 'function' &&
    raw.call && raw.apply
}

export function isArray(raw) {
  return raw instanceof Array && raw.push && raw.pop && raw.length
}

export function clone(raw) {
  if (hasJSON) {
    return JSON.parse(JSON.stringify(raw))
  } else {
    return raw
  }
}
