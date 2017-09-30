import { Raven } from '../raven'

import Source, { ISourceMessage } from '../source'
import { isString, isFunction, fill } from '../utils'
import { _window } from '../detection' 

export interface IXHRMessage extends ISourceMessage {
  payload: {
    action?: string
    method: string
    url: string
    status_code?: string
    duration?: number // 0 for timeout
  }
}

function genXHRMessage(action: string, method: string, url: string, status_code: string = null) {
  return {
    action, method, url, status_code, duration: 0
  }
}

export default (raven: Raven) => {

  function wrapProp(prop, xhr) {
    if (prop in xhr && isFunction(xhr[prop])) {
      fill(xhr, prop, (orig) => raven.wrap(orig)) // intentionally don't track filled methods on XHR instances
    }
  }

  if (!_window) return null

  return new Source<IXHRMessage>('breadcrumb.XHR', (action) => {
    // XMLHttpRequest
    if ('XMLHttpRequest' in _window) {
      const xhrproto = XMLHttpRequest.prototype

      fill(xhrproto, 'open', (originFunc) => {
        return function(method, url) { // preserve arity
          this.__raven_xhr = genXHRMessage('open', method, url)

          return originFunc.apply(this, arguments)
        }
      }, raven.__wrappedBuiltins)

      fill(xhrproto, 'send', (originFunc) => {
        return function(data) { // preserve arity
          const xhr = this

          const startAt = Date.now()

          const timeChecker = setTimeout(() => action({
            category: 'network',
            payload: xhr.__raven_xhr
          }), 30 * 1000 /* 30 sec */)

          function onreadystatechangeHandler() {
            if (xhr.__raven_xhr && (xhr.readyState === 1 || xhr.readyState === 4)) {
              if (timeChecker) {
                clearTimeout(timeChecker)
              }

              try {
                // touching statusCode in some platforms throws
                // an exception
                xhr.__raven_xhr.status_code = xhr.status
                xhr.__raven_xhr.duration = Date.now() - startAt
              } catch (e) { /* do nothing */ }

              action({
                category: 'network',
                payload: xhr.__raven_xhr
              })
            }
          }

          const props = [ 'onload', 'onerror', 'onprogress' ]
          for (const prop of props) {
            wrapProp(prop, xhr)
          }

          if ('onreadystatechange' in xhr && isFunction(xhr.onreadystatechange)) {
            fill(xhr, 'onreadystatechange', (orig) => raven.wrap(orig, undefined, onreadystatechangeHandler))
          } else {
            xhr.onreadystatechange = onreadystatechangeHandler
          }

          return originFunc.apply(this, arguments)
        }
      }, raven.__wrappedBuiltins)
    }

    // Fetch API
    if ('fetch' in _window) {
      _window['_origin_fetch'] = _window.fetch
      fill(_window, 'fetch', (origFetch) => {
        return (...args) => {
          const fetchInput = args[0]
          let method = 'GET'
          let url = null

          if (typeof fetchInput === 'string') {
            url = fetchInput
          } else {
            url = fetchInput.url
            if (fetchInput.method) {
              method = fetchInput.method
            }
          }

          if (args[1] && args[1].method) {
            method = args[1].method
          }

          const fetchData = {
            method, url, status_code: null, duration: 0
          }

          const startAt = Date.now()

          const timeChecker = setTimeout(() => action({
            category: 'network',
            payload: fetchData
          }), 30 * 1000 /* 30 sec */)

          return origFetch.apply(_window, args).then((resp) => {
            if (timeChecker) {
              clearTimeout(timeChecker)
            }

            fetchData.status_code = resp.status
            fetchData.duration = Date.now() - startAt

            action({
              category: 'network',
              payload: fetchData
            })

            return resp
          })
        }
      }, raven.__wrappedBuiltins)
    }
  })
}
