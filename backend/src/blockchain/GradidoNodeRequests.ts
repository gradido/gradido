import CONFIG from '../config'
import { RpcClient } from 'jsonrpc-ts'
import { randomInt } from 'crypto'

interface GroupDetails {
  GroupName: string
  GroupAlias: string
  CoinColor: number | string
}

enum GradidoNodeErrorCodes {
  JSON_RPC_ERROR_GRADIDO_NODE_ERROR = -10000,
  JSON_RPC_ERROR_UNKNOWN_GROUP = -10001,
}

// we have a service that can do math,
// and it has this methods
interface GradidoNodeService {
  // a method called sum that accepts 2 args of type number
  getgroupdetails: ({ groupAlias }: { groupAlias: string }) => GroupDetails
}

async function isCommunityAliasExisting(communityAlias: string): Promise<boolean> {
  const rpcClient = new RpcClient<GradidoNodeService>({ url: CONFIG.GRADIDO_NODE_API_URL })
  // now you have a strongly typed methods.
  // try to change [3, 2] to ['3', '2'] and the typescript compiler will catch you !
  const response = await rpcClient.makeRequest({
    method: 'getgroupdetails',
    params: { groupAlias: communityAlias },
    id: randomInt(10000),
    jsonrpc: '2.0',
  })
  const error = response.data.error
  if (error) {
    if (error.code === GradidoNodeErrorCodes.JSON_RPC_ERROR_UNKNOWN_GROUP) {
      return false
    }
    throw Error(error.message)
  }
  return true
}

export { isCommunityAliasExisting }
