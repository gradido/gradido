import { CONFIG } from '@/config'
import { ConfirmedTransaction } from '@/proto/3_3/ConfirmedTransaction'
import { AddressType, getAddressTypeEnumValue } from '@/proto/3_3/enum/AddressType'
import { LogError } from '@/server/LogError'
import JsonRpcClient from 'jsonrpc-ts-client'
import { JsonRpcEitherResponse } from 'jsonrpc-ts-client/dist/types/utils/jsonrpc'

const client = new JsonRpcClient({
  url: CONFIG.NODE_SERVER_URL,
})
/*
enum JsonRPCErrorCodes {
  NONE = 0,
  GRADIDO_NODE_ERROR = -10000,
  UNKNOWN_GROUP = -10001,
  NOT_IMPLEMENTED = -10002,
  // default errors from json rpc standard: https://www.jsonrpc.org/specification
  // -32700 	Parse error 	Invalid JSON was received by the server.
  PARSE_ERROR = -32700,
  // -32600 	Invalid Request The JSON sent is not a valid Request object.
  INVALID_REQUEST = -32600,
  // -32601 	Method not found 	The method does not exist / is not available.
  METHODE_NOT_FOUND = -32601,
  // -32602 	Invalid params 	Invalid method parameter(s).
  INVALID_PARAMS = -32602,
  // -32603 	Internal error 	Internal JSON - RPC error.
  INTERNAL_ERROR = -32603,
  // -32000 to -32099 	Server error 	Reserved for implementation-defined server-errors.
}
*/

interface ConfirmedTransactionList {
  transactions: string[]
  timeUsed: string
}

interface ConfirmedTransactionResponse {
  transaction: string
}

interface AddressTypeResult {
  addressType: string
}

function resolveResponse<T, R>(response: JsonRpcEitherResponse<T>, onSuccess: (result: T) => R): R {
  if (response.isSuccess()) {
    return onSuccess(response.result)
  } else if (response.isError()) {
    throw new LogError('error by json rpc request to gradido node server', response.error)
  }
  throw new LogError('no success and no error', response)
}

async function getTransactions(
  fromTransactionId: number,
  maxResultCount: number,
  iotaTopic: string,
): Promise<ConfirmedTransaction[]> {
  const response = await client.exec<ConfirmedTransactionList>('getTransactions', {
    format: 'base64',
    fromTransactionId,
    maxResultCount,
    communityId: iotaTopic,
  }) // sends payload {jsonrpc: '2.0',  params: ...}
  return resolveResponse(response, (result: ConfirmedTransactionList) =>
    result.transactions.map((transactionBase64) =>
      ConfirmedTransaction.fromBase64(transactionBase64),
    ),
  )
}

async function getTransaction(
  transactionId: number | Buffer,
  iotaTopic: string,
): Promise<ConfirmedTransaction | undefined> {
  const response = await client.exec<ConfirmedTransactionResponse>('gettransaction', {
    format: 'base64',
    communityId: iotaTopic,
    transactionId: typeof transactionId === 'number' ? transactionId : undefined,
    iotaMessageId: transactionId instanceof Buffer ? transactionId.toString('hex') : undefined,
  })
  return resolveResponse(response, (result: ConfirmedTransactionResponse) =>
    result.transaction !== '' ? ConfirmedTransaction.fromBase64(result.transaction) : undefined,
  )
}

async function getAddressType(pubkey: Buffer, iotaTopic: string): Promise<AddressType | undefined> {
  const response = await client.exec<AddressTypeResult>('getaddresstype', {
    pubkey: pubkey.toString('hex'),
    communityId: iotaTopic,
  })
  return resolveResponse(response, (result: AddressTypeResult) =>
    getAddressTypeEnumValue(result.addressType),
  )
}

export { getTransaction, getTransactions, getAddressType }
