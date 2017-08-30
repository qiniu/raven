import Source from '../source'

export function wrapMethod(console, level, callback) {
  const originalConsoleLevel = console[level]
  const originalConsole = console

  if (!(level in console)) {
    return
  }

  console[`_origin_${level}`] = originalConsoleLevel
  console[level] = function(...args) {
    const msg = args.join(' ')
    const data = {
      level,
      logger: 'console',
      extra: {
        'arguments': args
      }
    }

    if (originalConsoleLevel) {
      Function.prototype.apply.call(
        originalConsoleLevel,
        originalConsole,
        args
      )
    }

    callback(msg, data)
  }
}

const levels = [ 'debug', 'info', 'warn', 'error', 'log' ]

export default () => {
  return new Source('breadcrumb.console', (action) => {
    const consoleMethodCallback = (msg, data) => {
      action({
        category: 'console',
        payload: {
          level: data.level,
          message: msg
        }
      })
    }

    for (const level of levels) {
      wrapMethod(console, level, consoleMethodCallback)
    }
  })
}

