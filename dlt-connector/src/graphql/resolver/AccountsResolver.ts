/* eslint-disable camelcase */
import { AddressType_NONE } from 'gradido-blockchain-js'
import { Arg, Query, Resolver } from 'type-graphql'

import { getAddressType } from '@/client/GradidoNode'
import { KeyPairCalculation } from '@/interactions/keyPairCalculation/KeyPairCalculation.context'
import { logger } from '@/logging/logger'
import { KeyPairCacheManager } from '@/manager/KeyPairCacheManager'
import { uuid4ToHash } from '@/utils/typeConverter'

import { TransactionErrorType } from '../enum/TransactionErrorType'
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
}
