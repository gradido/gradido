const plugins = [
  {
    requestDidStart() {
      return {
        willSendResponse(requestContext: any) {
          const { setHeaders = [] } = requestContext.context
          setHeaders.forEach(({ key, value }: { [key: string]: string }) => {
            requestContext.response.http.headers.append(key, value)
          })
          return requestContext
        },
      }
    },
  },
]

export default plugins
