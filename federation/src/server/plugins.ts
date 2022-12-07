/* eslint-disable @typescript-eslint/no-explicit-any */
/* eslint-disable @typescript-eslint/explicit-module-boundary-types */

import clonedeep from 'lodash.clonedeep'

const setHeadersPlugin = {
  requestDidStart() {
    return {
      willSendResponse(requestContext: any) {
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
  if (vars.password) vars.password = '***'
  if (vars.passwordNew) vars.passwordNew = '***'
  return vars
}

const logPlugin = {
  requestDidStart(requestContext: any) {
    const { logger } = requestContext
    const { query, mutation, variables, operationName } = requestContext.request
    if (operationName !== 'IntrospectionQuery') {
      logger.info(`Request:
${mutation || query}variables: ${JSON.stringify(filterVariables(variables), null, 2)}`)
    }
    return {
      willSendResponse(requestContext: any) {
        if (operationName !== 'IntrospectionQuery') {
          if (requestContext.context.user) logger.info(`User ID: ${requestContext.context.user.id}`)
          if (requestContext.response.data) {
            logger.info('Response Success!')
            logger.trace(`Response-Data:
${JSON.stringify(requestContext.response.data, null, 2)}`)
          }
          if (requestContext.response.errors)
            logger.error(`Response-Errors:
${JSON.stringify(requestContext.response.errors, null, 2)}`)
        }
        return requestContext
      },
    }
  },
}

const plugins =
  process.env.NODE_ENV === 'development' ? [setHeadersPlugin] : [setHeadersPlugin, logPlugin]

export default plugins
