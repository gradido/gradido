import { DisbursementClientFactory } from '@/federation/client/DisbursementClientFactory'
import { Community as DbCommunity, FederatedCommunity as DbFederatedCommunity } from 'database'
import { CONFIG } from '@/config'
import { LogError } from '@/server/LogError'
import { DisbursementJwtResult } from '@/federation/client/1_0/model/DisbursementJwtResult'

export async function sendDisburseJwtToSenderCommunity(senderCommunity: DbCommunity, disburseJwt: string): Promise<DisbursementJwtResult> {
  const senderFCom = await DbFederatedCommunity.findOneOrFail({
    where: {
      publicKey: senderCommunity.publicKey,
      apiVersion: CONFIG.FEDERATION_BACKEND_SEND_ON_API,
    },
  })
  const disbursementClient = DisbursementClientFactory.getInstance(senderFCom)
  if (!disbursementClient) {
    throw new LogError('Disbursement client not found', senderCommunity.publicKey)
  }
  const result = await disbursementClient.disburseJwt(disburseJwt)
  if (!result.accepted) {
    throw new LogError('Disbursement failed', result.message)
  }
  return result
}