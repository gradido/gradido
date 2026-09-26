import clonedeep from 'lodash.clonedeep'

const setHeadersPlugin = {
  requestDidStart() {
    return {
      willSendResponse(requestContext: any) {
        const { setHeaders = [] } = requestContext.context
        setHeaders.forEach(({ key, value }: Record<string, string>) => {
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
  if (vars?.password) {
    vars.password = '***'
  }
  if (vars?.passwordNew) {
    vars.passwordNew = '***'
  }
  if (vars?.presenceCode) {
    vars.presenceCode = '***'
  }
  // What one member writes to another: a chat message (sendChatMessage, `$body` in the wallet's
  // chat.graphql) and the subject of a letter (sendEmail, `$subject`). A chat message may carry
  // the address of a video room, and whoever knows it can join the call. No other document of
  // wallet or admin names a variable so. The letter's text travels as `memo`, like the text of
  // every booking and contribution, and is still written.
  if (vars?.body) {
    vars.body = '***'
  }
  if (vars?.subject) {
    vars.subject = '***'
  }
  return vars
}

export const logPlugin = {
  requestDidStart(requestContext: any) {
    const { logger } = requestContext
    const { query, mutation, variables, operationName } = requestContext.request
    if (operationName !== 'IntrospectionQuery') {
      logger.debug('requestDidStart:', { operationName, variables: filterVariables(variables) })
      logger.info(`Request:
${mutation || query}variables: ${JSON.stringify(filterVariables(variables), null, 2)}`)
    }
    return {
      willSendResponse(requestContext: any) {
        if (operationName !== 'IntrospectionQuery') {
          if (requestContext.context.user) {
            logger.info(`User ID: ${requestContext.context.user.id}`)
          }
          if (requestContext.response.data) {
            logger.info('Response Success!')
            // A video room is open to whoever knows its address: the answer of a request that was
            // handed one (chatVideoRoom) stays out of the log. The request's budget counts the
            // rooms, over aliases and every operation of a batch.
            if (requestContext.context.requestBudget?.chatVideoRoomsServed) {
              logger.trace('Response-Data: left out, it holds a video room')
            } else {
              logger.trace(`Response-Data:
${JSON.stringify(requestContext.response.data, null, 2)}`)
            }
          }
          if (requestContext.response.errors) {
            logger.error(`Response-Errors:
${JSON.stringify(requestContext.response.errors, null, 2)}`)
          }
        }
        return requestContext
      },
    }
  },
}

export const plugins =
  process.env.NODE_ENV === 'development' ? [setHeadersPlugin] : [setHeadersPlugin, logPlugin]
