declare const global: any

import {
  isUndefined, isObject, isError, isNil
} from './utils'

export const _window = !isUndefined(window) ? window
              : !isUndefined(global) ? global
              : !isUndefined(self) ? self
              : {}
export const _document = _window['document']
export const _navigator = _window['navigator']

export const hasJSON = !!(isObject(JSON) && !isNil(JSON.stringify))
export const hasDocument = !isUndefined(_document)
export const hasNavigator = !isUndefined(_navigator)
