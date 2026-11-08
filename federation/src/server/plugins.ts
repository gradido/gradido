import { Kind } from 'graphql'

const setHeadersPlugin = {
  async requestDidStart() {
    return {
      async willSendResponse(requestContext: any) {
        const { setHeaders = [] } = requestContext.contextValue
        setHeaders.forEach(({ key, value }: { [key: string]: string }) => {
          requestContext.response.http.headers.set(key, value)
        })
        return requestContext
      },
    }
  },
}

// An error may quote a variable back: a string longer than this is written as its length. The
// sealed command of a chat message with a picture arrives as a jwt of some 100 KB (P7b).
const LOGGED_STRING_MAX_LENGTH = 1000
const withLongStringsAsLength = (_key: string, value: unknown): unknown =>
  typeof value === 'string' && value.length > LOGGED_STRING_MAX_LENGTH
    ? `*** ${value.length} characters`
    : value

// One line per request, as the backend writes it: what it asked for, how long it took, and
// whether it failed -- `mutation sendCommand`; there is no signed-in member here to name. The
// line names the root fields, since a document need not carry a name. Neither the document nor
// its variables are written: the variables carry the sealed commands of the other communities.
const requestSummary = (requestContext: any): string => {
  const { operation, operationName } = requestContext
  if (!operation) {
    // The document did not parse or validate; its errors follow at level error.
    return operationName ?? '(no operation)'
  }
  const fields = operation.selectionSet.selections
    .map((selection: any) => (selection.kind === Kind.FIELD ? selection.name.value : '...'))
    .join(',')
  return `${operation.operation} ${fields}`
}

export const logPlugin = {
  async requestDidStart(requestContext: any) {
    const { logger } = requestContext
    const started = performance.now()
    return {
      async willSendResponse(requestContext: any) {
        if (requestContext.request.operationName === 'IntrospectionQuery') {
          return requestContext
        }
        // What is answered: Apollo Server 5 keeps data and errors one level down, and has
        // neither for an answer that is delivered in parts.
        const { body } = requestContext.response
        const answer = body.kind === 'single' ? body.singleResult : {}
        const duration = Math.round(performance.now() - started)
        logger.info(
          `${requestSummary(requestContext)} ${duration}ms ${answer.errors ? 'errors' : 'ok'}`,
        )
        if (answer.data) {
          logger.trace(`Response-Data:
${JSON.stringify(answer.data, null, 2)}`)
        }
        if (answer.errors) {
          logger.error(`Response-Errors:
${JSON.stringify(answer.errors, withLongStringsAsLength, 2)}`)
        }
        return requestContext
      },
    }
  },
}

export const plugins =
  process.env.NODE_ENV === 'development' ? [setHeadersPlugin] : [setHeadersPlugin, logPlugin]
