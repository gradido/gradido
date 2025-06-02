import { CONFIG } from '@/config'
import { DisbursementJwtResult } from '@/federation/client/1_0/model/DisbursementJwtResult'
import { DisbursementClientFactory } from '@/federation/client/DisbursementClientFactory'
import { LogError } from '@/server/LogError'
import { backendLogger as logger } from '@/server/logger'
import { Community as DbCommunity, FederatedCommunity as DbFederatedCommunity } from 'database'

export async function sendDisburseJwtToSenderCommunity(
  senderCommunity: DbCommunity,
  disburseJwt: string,
): Promise<DisbursementJwtResult> {
  logger.info('sendDisburseJwtToSenderCommunity... args=', {
    senderCommunity,
    disburseJwt,
  })
  const senderFCom = await DbFederatedCommunity.findOneOrFail({
    where: {
      publicKey: senderCommunity.publicKey,
      apiVersion: CONFIG.FEDERATION_BACKEND_SEND_ON_API,
    },
  })
  const disbursementClient = DisbursementClientFactory.getInstance(senderFCom)
  if (!disbursementClient) {
    throw new LogError('Disbursement client not found', senderCommunity.publicKey.toString('hex'))
  }
  logger.debug('sendDisburseJwtToSenderCommunity... vor disburseJwt()')
  const result = await disbursementClient.disburseJwt(disburseJwt)
  logger.debug('sendDisburseJwtToSenderCommunity... nach disburseJwt() result=', result)
  if (!result.accepted) {
    throw new LogError('Disbursement failed', result.message)
  }
  return result
}
