import CONFIG from '../config'
import { RpcClient, RpcError } from 'jsonrpc-ts'
import { randomInt } from 'crypto'

interface GroupDetails {
  GroupName: string
  GroupAlias: string
  CoinColor: number | string
}

enum GradidoNodeErrorCodes {
  JSON_RPC_ERROR_GRADIDO_NODE_ERROR = -10000,
  JSON_RPC_ERROR_UNKNOWN_GROUP = -10001,
  // default json rpc error codes
  JSON_RPC_ERROR_INVALID_PARAMS = -32602,
}

// gradido Node service definition
interface GradidoNodeService {
  // a method called sum that accepts 2 args of type number
  getgroupdetails: ({ groupAlias }: { groupAlias: string }) => GroupDetails
}

async function isCommunityAliasExisting(communityAlias: string): Promise<boolean> {
  const rpcClient = new RpcClient<GradidoNodeService>({ url: CONFIG.GRADIDO_NODE_API_URL })
  // now you have a strongly typed methods.
  // try to change [3, 2] to ['3', '2'] and the typescript compiler will catch you !
  try {
    const response = await rpcClient.makeRequest({
      method: 'getgroupdetails',
      params: { groupAlias: communityAlias },
      id: randomInt(10000),
      jsonrpc: '2.0',
    })
    console.log(response)
    return true
  } catch (e) {
    if (e instanceof RpcError) {
      if (e.getCode() === GradidoNodeErrorCodes.JSON_RPC_ERROR_UNKNOWN_GROUP) {
        return false
      }
      let errorMessage = e.message
      if (e.getData()) {
        errorMessage += e.getData()
      }
      throw Error(errorMessage)
    } else {
      throw e
    }
  }
}

export { isCommunityAliasExisting }
