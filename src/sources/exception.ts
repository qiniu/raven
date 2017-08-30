import Source from '../source'
import * as TraceKit from 'tracekit'

export default () => {
  return new Source('exception', (action) => {
    TraceKit.report.subscribe((errorMsg) => {
      action({
        type: 'error',
        category: 'error',
        payload: errorMsg
      })
    })
  })
}
