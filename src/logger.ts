export interface ILogger {
  log?(message: string | any, ...args): void
  info?(message: string | any, ...args): void
  warn?(message: string | any, ...args): void
  error?(message: string | Error, ...args): void
}

const levels = [ 'log', 'info', 'warn', 'error' ]
const originalLevels: any = {}
levels.forEach((level) => originalLevels[level] = console[level])

const levelColors = {
  qiniu: '#29a8e1',
  normal: '#333',
  log: '#86C166',   // NAE
  info: '#006284',  // HANADA
  warn: '#CA7A2C',  // KOHAKU
  error: '#CB1B45'  // KURUNAI
}

const logger: ILogger = {}
levels.forEach((level) => logger[level] = (message, ...args) => {
  if (typeof message !== 'string' || args.length > 0) {
    return originalLevels[level].apply(console, [ message ].concat(args))
  }

  return originalLevels[level].call(
    console,
    `%c[RAVEN-DEBUG] %c[${level.toUpperCase()}] %c${message}`,
    `color: ${levelColors.qiniu}`,
    `color: ${levelColors[level]}`,
    `color: ${levelColors.normal}`
  )
})

export default logger

// TODO: Logger could be a devtools