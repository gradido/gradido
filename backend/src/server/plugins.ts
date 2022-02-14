/* eslint-disable @typescript-eslint/no-explicit-any */
/* eslint-disable @typescript-eslint/explicit-module-boundary-types */

import { ApolloLogPlugin, LogMutateData } from 'apollo-log'

const copyInstance = (instance: any) => {
  const data = Object.assign(
    Object.create(Object.getPrototypeOf(instance)),
    JSON.parse(JSON.stringify(instance)),
  )
  return data
}

const plugins = [
  {
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
  },
  ApolloLogPlugin({
    mutate: (data: LogMutateData) => {
      // We need to deep clone the object in order to not modify the actual request
      const data2 = copyInstance(data)

      // mask password if part of the query
      if (data2.context.request.variables && data2.context.request.variables.password) {
        data2.context.request.variables.password = '***'
      }

      // mask token at all times
      data2.context.context.token = '***'

      return data2
    },
  }),
]

export default plugins
