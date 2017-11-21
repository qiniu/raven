import { Raven } from '../raven'

import Source, { ISourceMessage, ActionFunc } from '../source'
import { fill, htmlTreeAsString } from '../utils'
import { _window, _document, hasDocument } from '../detection'

let _keypressTimeout = null
let _lastCapturedEvent = null

function domEventHandler(evtName: string, action: ActionFunc<ISourceMessage>) {
  return (evt) => {

    // reset keypress timeout; e.g. triggering a 'click' after
    // a 'keypress' will reset the keypress debounce so that a new
    // set of keypresses can be recorded
    _keypressTimeout = null

    // It's possible this handler might trigger multiple times for the same
    // event (e.g. event propagation through node ancestors). Ignore if we've
    // already captured the event.
    if (_lastCapturedEvent === evt) return
    
    _lastCapturedEvent = evt

    // try/catch both:
    // - accessing evt.target (see getsentry/raven-js#838, #768)
    // - `htmlTreeAsString` because it's complex, and just accessing the DOM incorrectly
    //   can throw an exception in some circumstances.
    let target = null
    try {
      target = htmlTreeAsString(evt.target)
    } catch(ex) {
      target = '<unknown>'
    }

    const payload: any = {
      event: evtName,
      path: target
    }

    if (evtName === 'click' || evtName === 'touchstart') {
      payload.pos = {
        x: evt.pageX,
        y: evt.pageY
      }
      payload.pageSize = {
        width: _document.body.offsetWidth,
        height: _document.body.offsetHeight
      }
    }

    if (evtName === 'input') {
      payload.value = evt.target.value
    }

    if (evtName === 'scrollhold') {
      payload.left = evt.target.scrollLeft
      payload.top = evt.target.scrollTop
    }

    action({
      category: 'ui.events',
      payload
    })
  }
}

const debounceDuration = 1000 // milliseconds

function keypressHandler(action: ActionFunc<ISourceMessage>) {
  return (evt) => {
    let target
    try {
      target = evt.target
    } catch(e) {
      // just accessing event properties can throw an exception in some rare circumstances
      // see: https://github.com/getsentry/raven-js/issues/838
      return
    }

    const tagName = target && target.tagName

    // only consider keypress events on actual input elements
    // this will disregard keypresses targeting body (e.g. tabbing
    // through elements, hotkeys, etc)
    if (!tagName || tagName !== 'INPUT' && tagName !== 'TEXTAREA' && !target.isContentEditable)
      return

    // record first keypress in a series, but ignore subsequent
    // keypresses until debounce clears
    const timeout = _keypressTimeout
    if (!timeout) {
      domEventHandler('input', action)(evt)
    }
    
    clearTimeout(timeout)
    _keypressTimeout = setTimeout(() => {
      _keypressTimeout = null
    }, debounceDuration)
  }
}

function isVisible(node) {
  if (node.nodeType == Node.TEXT_NODE) return false

  if (node.nodeType != Node.ELEMENT_NODE) return false

  if (node.offsetHeight === 0 || node.offsetWidth === 0) return false
  
  const style = window.getComputedStyle(node)

  return (style.display != 'none' && style.visibility != 'hidden')
}

function isScrollable(el) {
  const style = window.getComputedStyle(el)
  const overflowPattern = /(auto|scroll)/

  return (el.scrollHeight > el.offsetHeight ||
          el.scrollWidth > el.offsetWidth) &&
          (style.overflow.match(overflowPattern) ||
          style.overflowX.match(overflowPattern) ||
          style.overflowY.match(overflowPattern))
}

function findScrollableElement(root) {
  const array = []

  function loop(el) {

    if (!isVisible(el)) return
  
    if (isScrollable(el)) {
      array.push(el)
    }

    for (let i = 0; i < el.childNodes.length; ++i) {
      loop(el.childNodes.item(i))
    }
  }

  loop(root)

  return array
}

export default () => {
  if (!_window || !_document || !hasDocument) return

  return new Source('breadcrumb.DOMEvents', (action) => {

    
    if (_document.addEventListener) {
      _document.addEventListener('click', domEventHandler('click', action), false)
      _document.addEventListener('keypress', keypressHandler(action), false)

      _window.addEventListener('load', () => {
        const scrollableElements = findScrollableElement(_document.body)
  
        scrollableElements.forEach(scrollableEl => {
          let timer = null
  
          scrollableEl.addEventListener('scroll', evt => {
            if (timer) {
              clearTimeout(timer)
              timer = null
            } else {
              domEventHandler('scrollstart', action)(evt)
            }
  
            timer = setTimeout(() => {
              domEventHandler('scrollhold', action)(evt)
              timer = null
            }, 2000)
          }, false)
        })
      })
    } else {
      // IE8 Compatibility
      _document.attachEvent('onclick', domEventHandler('click', action), false)
      _document.attachEvent('onkeypress', keypressHandler(action), false)

      _window.attachEvent('load', () => {
        const scrollableElements = findScrollableElement(_document.body)

        scrollableElements.forEach(scrollableEl => {
          let timer = null
  
          scrollableEl.attachEvent('scroll', evt => {
            if (timer) {
              clearTimeout(timer)
              timer = null
            } else {
              domEventHandler('scrollstart', action)(evt)
            }

            timer = setTimeout(() => {
              domEventHandler('scrollhold', action)(evt)
              timer = null
            }, 2000)
          }, false)
        })
      })
    }
  })
}