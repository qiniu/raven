declare const global: any
declare const require: any
declare let raven_option: IRavenOption

import * as TraceKit from 'tracekit'

// Detection
import {
  _window, _document, _navigator,
  hasJSON, hasDocument, hasNavigator
} from './detection'

// Store
import { Store, CollectionStore } from './store'
import { MessagesStore } from './messages-store'

// Transfer
import Transfer from './transfer'

// Sources
import Source from './source'
import XHRSource from './sources/xhr'
import ConsoleSource from './sources/console'
import HistorySource from './sources/history'
import UIEventSource from './sources/ui-event'
import ExpectionSource from './sources/exception'

// Logger
import logger, { ILogger } from './logger'

import {
  hasKey, merge, clone,
  isUndefined, isObject, isError, isNil, isFunction, isArray
} from './utils'

export type URLPattern = RegExp | string

export interface IRavenOption {
  release?: string
  environment?: string
  tags?: any
  whitelistUrls?: URLPattern[]
  ignoreUrls?: URLPattern[]
  ignoreError?: string[]
  autoInstall?: boolean
  instrument?: boolean | {
    tryCatch?: boolean
  }
  autoBreadcrumbs?: boolean | {
    xhr?: boolean
    console?: boolean
    dom?: boolean
    history?: boolean
  }

  transfer?: Transfer
  transfers?: Transfer[]
  sources?: Source<any>[]

  debug?: boolean
}

const DEFAULT_RAVEN_OPTION: IRavenOption = {
  environment: 'production',
  autoInstall: true,
  instrument: {
    tryCatch: true
  },
  autoBreadcrumbs: {
    xhr: true,
    console: true,
    dom: true,
    history: true
  }
}

export type ValueCallback<T> = (value?: T, callback?: ValueCallback<T>) => T

export class Raven {

  VERSION: '3.13.1'

  option: IRavenOption

  callbacks: { [key: string]: ValueCallback<any> } = {}

  configStore = new Store('config')
  contextStore = new Store('context')
  messages = new MessagesStore(this)

  transfers: Transfer[] = []
  sources: Source<any>[] = []

  __wrappedBuiltins: any[] = []

  get Transfer() {
    return Transfer
  }

  get Source() {
    return Source
  }

  get logger() {
    return logger
  }

  /**
   * Raven Constructor
   * @param option Raven Option
   */
  constructor(option: IRavenOption = {}) {
    this.option = merge(clone(DEFAULT_RAVEN_OPTION), option)

    if (this.option.debug) {
      this.debug = true
    }

    // Set Up
    if (this.option.release) {
      this.setRelease(this.option.release)
    }

    if (this.option.environment) {
      this.setEnvironment(this.option.environment)
    }

    if (this.option.transfer) {
      this.addTransfer(this.option.transfer)
    }

    if (this.option.transfers) {
      for (const transfer of this.option.transfers) {
        this.addTransfer(transfer)
      }
    }

    if (this.option.sources) {
      for (const source of this.option.sources) {
        this.addSource(source)
      }
    }

    if (this.option.autoInstall) {
      this.install()
    }
  }

  /**
   * getter debug
   * @return {boolean}
   */
  get debug(): boolean {
    return this.configStore.get('debug') || false
  }

  /**
   * setter debug
   */
  set debug(value) {
    if (value === true) {
      logger.info(`[CONFIG] set debug = ${value}`)
    }

    this.configStore.set('debug', value)
  }

  /**
   * Install raven's instruments
   * @return {Raven}
   */
  install() {
    // Instrument TryCatch
    if (this.option.instrument && this.option.instrument['tryCatch']) {
      this.addSource(ExpectionSource())
      if (_window) {
        _window.onerror = (msg, source, line, col, err) => {
          this.captureException(err)
        }
      }
    }

    // Instrumeny Breadcrumb
    if (this.option.autoBreadcrumbs) {
      this._setupBreadcrumb()
    }

    return this
  }

  /**
   * Dispose raven
   * @return {Raven}
   */
  uninstall() {
    // Restore wrapped builtins
    this._restoreBuiltIns()

    // Dispose all sources
    this.sources.forEach((source) => source.dispose())

    return this
  }

  /**
   * Add new source into raven
   * 
   * @param {Source} source Data source
   * @return {Raven}
   * 
   * @example
   * raven.addSource(source)
   */
  addSource(source: Source<any>) {
    if (!source) return

    source.onAction((message) => this.messages.add(message))

    this.sources.push(source)

    if (this.debug) {
      this.logger.info(`[SOURCE] added source ${source.name}`)
    }

    return this
  }

  /**
   * add a data transfer
   * 
   * @param {Transfer} transfer Custom data transfer
   * @return {Raven}
   * 
   * @example
   * raven.addTransfer(transfer)
   */
  addTransfer(transfer: Transfer) {
    transfer.config(this.configStore.toJS())

    this.transfers.push(transfer)
    
    if (this.debug) {
      this.logger.info(`[TRANSFER] added transfer ${transfer.name}`)
    }

    return this
  }

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
  config(key: string, value: string)

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
  config(object: any)

  config(keyOrObject: any, value?: string) {
    if (typeof keyOrObject === 'string') {
      const key: string = keyOrObject

      this.configStore.set(key, value)

      if (this.debug) {
        this.logger.info(`[CONFIG] set ${key} = ${value}`)
      }
    } else {
      for (const key in keyOrObject) {
        if (keyOrObject.hasOwnProperty(key)) {
          const value = keyOrObject[key]
          this.config(key, value)
        }
      }
    }

    return this
  }

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
  captureException(ex: Error, options: any = {}) {
    // If not an Error is passed through, recall as a message instead
    if (!isError(ex)) {
      return
    }

    // TraceKit.report will re-raise any exception passed to it,
    // which means you have to wrap it in try/catch. Instead, we
    // can wrap it here and only re-raise if TraceKit.report
    // raises an exception different from the one we asked to
    // report on.
    try {
      TraceKit.report(ex)
    } catch(ex1) {
      if (ex !== ex1) {
        throw ex1
      }
    }

    if (this.debug) {
      this.logger.error(`[EXCEPTION] capture exception: ${ex.message}`)
    }

    return this
  }

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
  setUserContext(user) {
    this.contextStore.set('user', user)

    if (this.transfers.length > 0) {
      this.transfers.forEach((transfer) => transfer.config(this.contextStore.toJS()))
    }

    if (this.debug) {
      this.logger.info(`[CONTEXT] set user context: ${user}`)
    }

    return this
  }

  /**
   * Merge tags to be sent along with the payload.
   *
   * @param {object} tags An object representing tags
   * @return {Raven}
   * 
   * @example
   * raven.setTagsContext('tags', [ 'beta' ])
   */
  setTagsContext(tags) {
    this.contextStore.set('tags', tags)
    
    if (this.transfers.length > 0) {
      this.transfers.forEach((transfer) => transfer.config(this.contextStore.toJS()))
    }
    
    if (this.debug) {
      this.logger.info(`[CONTEXT] set tags context: ${tags}`)
    }

    return this
  }

  /**
   * Merge extra attributes to be sent along with the payload.
   *
   * @param {object} extra An object representing extra data [optional]
   * @return {Raven}
   */
  setExtraContext(extra) {
    this.contextStore.set('extra', extra)

    if (this.transfers.length > 0) {
      this.transfers.forEach((transfer) => transfer.config(this.contextStore.toJS()))
    }
    
    if (this.debug) {
      this.logger.info(`[CONTEXT] set extra context: ${extra}`)
    }
    
    return this
  }

  /**
   * Clear all of the context.
   *
   * @return {Raven}
   * 
   * @example
   * raven.clearContext()
   */
  clearContext() {
    this.contextStore.clear()
    
    if (this.debug) {
      this.logger.info(`[CONTEXT] clear context`)
    }

    return this
  }

  /**
   * Get a copy of the current context. This cannot be mutated.
   *
   * @return {object} copy of context
   */
  getContext() {
    return this.contextStore.toJS()
  }

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
  setEnvironment(env: string) {
    this.contextStore.set('environment', env)
    
    if (this.debug) {
      this.logger.info(`[CONTEXT] set environment context: ${env}`)
    }

    return this
  }

  /**
   * Set release version of application
   *
   * @param {string} release Typically something like a git SHA to identify version
   * @return {Raven}
   * 
   * @example
   * raven.setRelease('public-v0.1.0')
   */
  setRelease(release: string) {
    this.contextStore.set('release', release)
    
    if (this.debug) {
      this.logger.info(`[CONTEXT] set release context: ${release}`)
    }

    return this
  }

  /**
   * Get the callback of the special point
   * 
   * @param {string} key Key of callback
   * @return {ValueCallback}
   * 
   * @example
   * raven.getCallback('breadcrumb')
   */
  getCallback(key: string) {
    if (isNil(this.callbacks[key])) {
      return () => false
    }

    return this.callbacks[key]
  }

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
  setCallback(key: string, callback?: ValueCallback<any>) {
    if (isUndefined(callback)) {
      this.callbacks[key] = null
      
      if (this.debug) {
        logger.info(`[CALLBACK] remove ${key} callback`)
      }
    } else if (isFunction(callback)) {
      this.callbacks[key] = callback
      
      if (this.debug) {
        logger.info(`[CALLBACK] set ${key} callback`)
      }
    }
  }

  /**
   * Set the breadcrumb callback option
   *
   * @param {ValueCallback} callback The callback to run which some breadcrumb
   *                            message create
   * @return {Raven}
   */
  setBreadcrumbCallback(callback: ValueCallback<any>) {
    const original = this.getCallback('breadcrumb')
    this.setCallback('breadcrumb', composeCallback(original, callback))
  }

  /**
   * Set the dataCallback option
   *
   * @param {ValueCallback} callback The callback to run which some exception
   *                            message create
   * @return {Raven}
   */
  setExceptionCallback(callback: ValueCallback<any>) {
    const original = this.getCallback('exception')
    this.setCallback('exception', composeCallback(original, callback))
  }

  /**
   * Wrap code within a context and returns back a new function to be executed
   *
   * @param {object} options A specific set of options for this context [optional]
   * @param {function} func The function to be wrapped in a new context
   * @param {function} func A function to call before the try/catch wrapper [optional, private]
   * @return {function} The newly wrapped functions with a context
   */
  wrap(options, func?, _before?) {
    // 1 argument has been passed, and it's not a function
    // so just return it
    if (isUndefined(func) && !isFunction(options)) {
      return options
    }

    // option is optional
    if (isFunction(options)) {
      func = options
      options = undefined
    }

    // At this point, we've passed along 2 arguments, and the second one
    // is not a function either, so we'll just return the second argument.
    if (!isFunction(func)) {
      return func
    }

    // We don't wanna wrap it twice!
    try {
      if (func.__raven__) {
        return func
      }

      // If this has already been wrapped in the past, return that
      if (func.__raven_wrapper__)  {
        return func.__raven_wrapper__
      }
    } catch (e) {
      // Just accessing custom props in some Selenium environments
      // can cause a "Permission denied" exception (see raven-js#495).
      // Bail on wrapping and return the function as-is (defers to window.onerror).
      return func
    }

    const self = this

    function wrapped() {
      var args = [], i = arguments.length,
          deep = !options || options && options.deep !== false

      if (_before && isFunction(_before)) {
          _before.apply(this, arguments)
      }

      // Recursively wrap all of a function's arguments that are
      // functions themselves.
      while(i--) args[i] = deep ? self.wrap(options, arguments[i]) : arguments[i]

      try {
        // Attempt to invoke user-land function
        // NOTE: If you are a Sentry user, and you are seeing this stack frame, it
        //       means Raven caught an error invoking your application code. This is
        //       expected behavior and NOT indicative of a bug with Raven.js.
        return func.apply(this, args)
      } catch(e) {
        self._ignoreNextOnError()
        self.captureException(e, options)
        throw e
      }
    }

    for (const prop in func) {
      if (hasKey(func, prop)) {
        wrapped[prop] = func[prop]
      }
    }
    wrapped.prototype = func.prototype

    func.__raven_wrapper__ = wrapped
    wrapped['__raven__'] = true
    wrapped['__inner__'] = func

    if (this.debug) {
      const funcName = func.name || 'anynomous'
      logger.info(`wrap function ${funcName}`)
    }

    return wrapped
  }

  /**
   * Wrap code within a context so Raven can capture errors
   * reliably across domains that is executed immediately.
   *
   * @param {function} func The callback to be immediately executed within the context
   * @param {array} args An array of arguments to be called with the callback [optional]
   * @param {object} options A specific set of options for this context [optional]
   */
  context(func, args: any[])
  context(func, options: any)
  context(func, args: any[], options: any)
  context(func, argsOrOptions: any, options?: any) {
    let args = null
    let opts = undefined

    switch (true) {
      case isArray(argsOrOptions) && isUndefined(options):  // overload +1
        args = argsOrOptions
        break

      case !isArray(argsOrOptions) && isUndefined(options):  // overload +2
        args = []
        opts = argsOrOptions
        break

      case isArray(argsOrOptions) && !isUndefined(options):  // overload +3
        args = argsOrOptions
        opts = options
        break
    }

    return this.wrap(options, func).apply(this, args)
  }

  _ignoreOnError = 0

  _ignoreNextOnError() {
    this._ignoreOnError += 1
    setTimeout(() => {
      this._ignoreOnError -= 1
    })
  }

  _setupBreadcrumb() {
    if (
      this.option.autoBreadcrumbs === true ||
      (!!this.option.autoBreadcrumbs && typeof this.option.autoBreadcrumbs['xhr'] === 'undefined') ||
      this.option.autoBreadcrumbs['xhr'] === true
    ) {
      this.addSource(XHRSource(this))
    }

    if (
      this.option.autoBreadcrumbs === true ||
      (!!this.option.autoBreadcrumbs && typeof this.option.autoBreadcrumbs['history'] === 'undefined') ||
      this.option.autoBreadcrumbs['history'] === true
    ) {
      this.addSource(HistorySource(this))
    }

    if (
      this.option.autoBreadcrumbs === true ||
      (!!this.option.autoBreadcrumbs && typeof this.option.autoBreadcrumbs['dom'] === 'undefined') ||
      this.option.autoBreadcrumbs['dom'] === true
    ) {
      this.addSource(UIEventSource())
    }

    if (
      this.option.autoBreadcrumbs === true ||
      (!!this.option.autoBreadcrumbs && typeof this.option.autoBreadcrumbs['console'] === 'undefined') ||
      this.option.autoBreadcrumbs['console'] === true
    ) {
      this.addSource(ConsoleSource())
    }
  }

  _restoreBuiltIns() {
    for (const [ obj, name, orig ] of this.__wrappedBuiltins) {
      obj[name] = orig
    }
  }
}

const raven = new Raven(_window.raven_option || {})

export default raven

function composeCallback(original: ValueCallback<any>, callback: ValueCallback<any>): ValueCallback<any> {
  return isFunction(callback)
    ? (data) => callback(data, original)
    : callback
}
