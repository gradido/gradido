/* eslint-disable camelcase */
import { AddressType_NONE } from 'gradido-blockchain-js'
import { Arg, Mutation, Query, Resolver } from 'type-graphql'

import { getAddressType } from '@/client/GradidoNode'
import { KeyPairCalculation } from '@/interactions/keyPairCalculation/KeyPairCalculation.context'
import { SendToIotaContext } from '@/interactions/sendToIota/SendToIota.context'
import { logger } from '@/logging/logger'
import { uuid4ToHash } from '@/utils/typeConverter'

import { TransactionErrorType } from '../enum/TransactionErrorType'
import { UserAccountDraft } from '../input/UserAccountDraft'
import { UserIdentifier } from '../input/UserIdentifier'
import { TransactionError } from '../model/TransactionError'
import { TransactionResult } from '../model/TransactionResult'

@Resolver()
export class AccountResolver {
  @Query(() => Boolean)
  async isAccountExist(@Arg('data') userIdentifier: UserIdentifier): Promise<boolean> {
    const accountKeyPair = await KeyPairCalculation(userIdentifier)
    const publicKey = accountKeyPair.getPublicKey()
    if (!publicKey) {
      throw new TransactionResult(
        new TransactionError(TransactionErrorType.NOT_FOUND, 'cannot get user public key'),
      )
    }
    // ask gradido node server for account type, if type !== NONE account exist
    const addressType = await getAddressType(
      publicKey.data(),
      uuid4ToHash(userIdentifier.communityUuid).convertToHex(),
    )
    logger.info('isAccountExist', userIdentifier)
    return addressType !== AddressType_NONE
  }

  @Mutation(() => TransactionResult)
  async registerAddress(
    @Arg('data')
    userAccountDraft: UserAccountDraft,
  ): Promise<TransactionResult> {
    try {
      return await SendToIotaContext(userAccountDraft)
    } catch (err) {
      if (err instanceof TransactionError) {
        return new TransactionResult(err)
      } else {
        logger.error('error in register address: ', err)
        throw err
      }
    }
  }
}
