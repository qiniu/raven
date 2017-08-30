import { merge } from './utils'

export type SourceMessageType = 'message' | 'error'
export interface ISourceMessage {
  type?: SourceMessageType
  category: string
  payload: any
  timestamp?: number
  user?: any
  tags?: any
  extra?: any
}
export type ActionFunc<T> = (message: T) => any
export type ProcessorFunc<T> = (actionFunc: ActionFunc<T>) => any

const GEN_DEFAULT_SOURCE_MESSAGE = (): ISourceMessage => ({
  type: 'message',
  category: 'message',
  payload: {},
  timestamp: Date.now()
})

export default class Source<T> {

  name: string
  processor: ProcessorFunc<T>
  receivers: ActionFunc<T>[] = []

  /**
   * Class Source
   * @param {string} name Name of the source to identify
   * @param {function} processorFunc The processing function of the source
   * 
   * @example
   * new Source((action) => {
   *   whenSomethingHappen((value) => {
   *     action({
   *       category: 'something',
   *       payload: value
   *     })
   *   })
   * })
   */
  constructor(name: string, processorFunc: ProcessorFunc<T>) {
    this.name = name
    this.processor = processorFunc

    processorFunc(this.action.bind(this))
  }

  /**
   * Fire the message to raven
   * @param {ISourceMessage} message 
   */
  action(message: ISourceMessage) {
    const mergedMessage = merge(GEN_DEFAULT_SOURCE_MESSAGE(), message)

    this.receivers.forEach((receiver) => receiver(mergedMessage))
  }

  /**
   * bind the message event (only call by raven internally)
   * @param callback 
   */
  onAction(callback: ActionFunc<T>) {
    this.receivers.push(callback)
  }

  /**
   * Dispose the source (only call by raven internally)
   */
  dispose() {
    this.receivers.forEach((receiver) => receiver = null)
    this.receivers = []
  }
}
