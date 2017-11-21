import { Store } from './store'
import { IMessage } from './messages-store'
import { ISourceMessage } from './source'

export type Callback = (error?: Error, reason?: any) => void
export type TransferFunc = (data?: any, callback?: Callback) => void

export default class Transfer {

  name: string
  transfer?: TransferFunc
  configStore: Store

  queue: TransferFunc[] = []
  running = false

  constructor(name: string, transferFunc: TransferFunc = duplex) {
    this.name = name
    this.configStore = new Store(`transfer:${name}`)
    this.transfer = transferFunc
  }

  config(key: string, value: string)
  config(object: any)

  config(keyOrObject: any, value?: string) {
    if (typeof keyOrObject === 'string') {
      const key: string = keyOrObject

      this.configStore.set(key, value)
    } else {
      for (const key in keyOrObject) {
        if (keyOrObject.hasOwnProperty(key)) {
          const value = keyOrObject[key]
          
          this.config(key, value)
        }
      }
    }
  }

  send(message: IMessage) {
    const { data, sent } = message
    this.queue.push((callback: Callback) => {
      this.transfer.call(this, this.extendMessage(data), (err: Error) => {
        if (err) {
          return callback(err)
        }

        message.sent = true
        callback()
      })
    })

    if (!this.running) {
      this.run()
    }
  }

  extendMessage(message: ISourceMessage) {
    if (this.configStore.has('user')) {
      message['user'] = this.configStore.get('user')
    }

    if (this.configStore.has('tags')) {
      message['tags'] = this.configStore.get('tags')
    }

    if (this.configStore.has('extra')) {
      message['extra'] = this.configStore.get('extra')
    }

    if (this.configStore.has('release')) {
      message['release'] = this.configStore.get('release')
    }

    if (this.configStore.has('environment')) {
      message['environment'] = this.configStore.get('environment')
    }

    return message
  }

  run() {
    const current = this.queue.splice(0, 1)[0] // .shift()

    if (current) {
      this.running = true

      current(() => this.run())
    } else {
      this.running = false
    }
  }

}

function duplex(value) { return value }
