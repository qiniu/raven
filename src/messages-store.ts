import { CollectionStore } from './store'
import { ISourceMessage } from './source'
import { Raven } from './raven'
import { _window } from './detection'

import logger from './logger'

export interface IMessage {
  id: number,
  data: ISourceMessage
  sent: boolean
}

const breadcrumbCategories = [ 'console', 'history', 'ui.events', 'network' ]
const isBreadcrumb = (category: string) => {
  return breadcrumbCategories.indexOf(category) >= 0
}

export class MessagesStore {

  counter = 0

  parent: Raven
  store = new CollectionStore<IMessage>('messages')

  constructor(parent: Raven) {
    this.parent = parent
  }

  add(data: ISourceMessage) {

    if (_window && _window.location && _window.location.href) {
      data.url = _window.location.href
    }

    const message: IMessage = {
      id: ++this.counter,
      data,
      sent: false
    }

    this.store.push(message)

    this.parent.transfers.forEach((transfer) => transfer.send(message))

    if (isBreadcrumb(data.category)) {
      this.parent.getCallback('breadcrumb')(data)
    }

    if (data.category === 'error') {
      this.parent.getCallback('exception')(data)
    }

    if (this.parent.debug) {
      logger.log(`[MESSAGES] New message added [${data.category}], messages count: ${this.store.length}`)
      logger.log(`[MESSAGES]`, data)
    }
  }

}
