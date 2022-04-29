/* eslint-disable @typescript-eslint/no-explicit-any */
/* eslint-disable @typescript-eslint/explicit-module-boundary-types */

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

const logPlugin = {
  requestDidStart(requestContext: any) {
    const logger = requestContext.logger
    logger.debug(requestContext.request.query)
    logger.debug(JSON.stringify(requestContext.request.variables, null, 2))
    // logger.log('debug', JSON.stringify(requestContext.request, null, 2))
    return {
      willSendResponse(requestContext: any) {
        // console.log(requestContext)
        logger.debug(JSON.stringify(requestContext.response.errors, null, 2))
        logger.debug(JSON.stringify(requestContext.response.data, null, 2))
        return requestContext
      },
    }
  },
}

const plugins =
  process.env.NODE_ENV === 'development' ? [setHeadersPlugin] : [setHeadersPlugin, logPlugin]

export default plugins
