import clonedeep from 'lodash.clonedeep'

const setHeadersPlugin = {
  async requestDidStart() {
    return {
      async willSendResponse(requestContext: any) {
        const { setHeaders = [] } = requestContext.context
        setHeaders.forEach(({ key, value }: { [key: string]: string }) => {
          if (requestContext.response.http.headers.get(key)) {
            requestContext.response.http.headers.set(key, value)
          } else {
            requestContext.response.http.headers.append(key, value)
          }
        })
        return requestContext
      },
    }
  },
}

const filterVariables = (variables: any) => {
  const vars = clonedeep(variables)
  if (vars && vars.password) {
    vars.password = '***'
  }
  if (vars && vars.passwordNew) {
    vars.passwordNew = '***'
  }
  return vars
}

// A string longer than this is written as its length, the way the backend's request log writes a
// long value. The sealed command of a chat message with a picture arrives as a jwt of some
// 100 KB (P7b): written whole, every such request would put that much into the log on level
// info. An error may quote a variable back, so the errors are written the same way.
const LOGGED_STRING_MAX_LENGTH = 1000
const withLongStringsAsLength = (_key: string, value: unknown): unknown =>
  typeof value === 'string' && value.length > LOGGED_STRING_MAX_LENGTH
    ? `*** ${value.length} characters`
    : value

export const logPlugin = {
  async requestDidStart(requestContext: any) {
    const { logger } = requestContext
    const { query, mutation, variables, operationName } = requestContext.request
    if (operationName !== 'IntrospectionQuery') {
      logger.info(`Request:
${mutation || query}variables: ${JSON.stringify(filterVariables(variables), withLongStringsAsLength, 2)}`)
    }
    return {
      async willSendResponse(requestContext: any) {
        if (operationName !== 'IntrospectionQuery') {
          if (requestContext.context.user) {
            logger.info(`User ID: ${requestContext.context.user.id}`)
          }
          if (requestContext.response.data) {
            logger.info('Response Success!')
            logger.trace(`Response-Data:
${JSON.stringify(requestContext.response.data, null, 2)}`)
          }
          if (requestContext.response.errors) {
            logger.error(`Response-Errors:
${JSON.stringify(requestContext.response.errors, withLongStringsAsLength, 2)}`)
          }
        }
        return requestContext
      },
    }
  },
}

export const plugins =
  process.env.NODE_ENV === 'development' ? [setHeadersPlugin] : [setHeadersPlugin, logPlugin]
