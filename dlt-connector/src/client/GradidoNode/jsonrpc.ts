import JsonRpcClient from 'jsonrpc-ts-client'
import { JsonRpcEitherResponse } from 'jsonrpc-ts-client/dist/types/utils/jsonrpc'
import { getLogger } from 'log4js'
import { CONFIG } from '../../config'
import { LOG4JS_BASE_CATEGORY } from '../../config/const'
import { isPortOpenRetry } from '../../utils/network'

const logger = getLogger(`${LOG4JS_BASE_CATEGORY}.client.GradidoNode`)

export const client = new JsonRpcClient({
  url: CONFIG.NODE_SERVER_URL,
})

export class GradidoNodeRequestError<T> extends Error {
  private response?: JsonRpcEitherResponse<T>
  constructor(message: string, response?: JsonRpcEitherResponse<T>) {
    super(message)
    this.name = 'GradidoNodeRequestError'
    this.response = response
  }
  getResponse(): JsonRpcEitherResponse<T> | undefined {
    return this.response
  }
}

// return result on success or throw error
export function resolveResponse<T, R>(
  response: JsonRpcEitherResponse<T>,
  onSuccess: (result: T) => R,
): R {
  if (response.isSuccess()) {
    return onSuccess(response.result)
  } else if (response.isError()) {
    throw new GradidoNodeRequestError(response.error.message, response)
  }
  throw new GradidoNodeRequestError('no success and no error')
}

type WithTimeUsed<T> = T & { timeUsed?: string }

// template rpcCall, check first if port is open before executing json rpc 2.0 request
export async function rpcCall<T>(
  method: string,
  parameter: any,
): Promise<JsonRpcEitherResponse<T>> {
  logger.debug('call %s with %s', method, parameter)
  await isPortOpenRetry(CONFIG.NODE_SERVER_URL)
  return client.exec<T>(method, parameter)
}

// template rpcCall, check first if port is open before executing json rpc 2.0 request, throw error on failure, return result on success
export async function rpcCallResolved<T>(method: string, parameter: any): Promise<T> {
  const response = await rpcCall<WithTimeUsed<T>>(method, parameter)
  return resolveResponse(response, (result: WithTimeUsed<T>) => {
    if (result.timeUsed) {
      logger.info(`call %s, used ${result.timeUsed}`, method)
    }
    return result as T
  })
}
