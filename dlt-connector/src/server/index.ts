import { initTRPC, TRPCError } from '@trpc/server'
import * as v from 'valibot'
import { identifierAccountSchema } from '../schemas/account.schema'
import { KeyPairIdentifierLogic } from '../data/KeyPairIdentifier.logic'
import { getLogger } from 'log4js'
import { LOG4JS_BASE_CATEGORY } from '../config/const'
import { KeyPairCalculation } from '../interactions/keyPairCalculation/KeyPairCalculation.context'
import { getAddressType } from '../client/GradidoNode/api'
import { Uuidv4Hash } from '../data/Uuidv4Hash'
import { hex32Schema } from '../schemas/typeGuard.schema'
import { AddressType_NONE } from 'gradido-blockchain-js'

export const t = initTRPC.create()
const publicProcedure = t.procedure
const logger = getLogger(`${LOG4JS_BASE_CATEGORY}.server`)

export const appRouter = t.router({
  isAccountExist: publicProcedure
    .input(identifierAccountSchema)
    .output(v.boolean())
    .query(async ({ input: userIdentifier }) => {
      const accountKeyPair = await KeyPairCalculation(new KeyPairIdentifierLogic(userIdentifier))
      const publicKey = accountKeyPair.getPublicKey()
      if (!publicKey) {
        throw new TRPCError({
          code: 'NOT_FOUND',
          message: "couldn't calculate account key pair",
        })
      }

      // ask gradido node server for account type, if type !== NONE account exist
      const addressType = await getAddressType(
        v.parse(hex32Schema, publicKey.get()),
        new Uuidv4Hash(userIdentifier.communityUuid),
      )
      logger.info('isAccountExist')
      if(logger.isDebugEnabled()) {
        logger.debug('params', userIdentifier)
      }
      return addressType !== AddressType_NONE
    }),
  
  sendTransaction: publicProcedure
    .input(transactionDraftSchema)
    .output(v.instanceof(TransactionResult))
    .mutation(async ({ input: transactionDraft }) => {
      try {
        return await SendToIotaContext(transactionDraft)
        // eslint-disable-next-line @typescript-eslint/no-explicit-any
      } catch (error: any) {
        if (error instanceof TransactionError) {
          return new TransactionResult(error)
        } else {
          throw error
        }
      }
    })
})

/*

async sendTransaction(
    @Arg('data')
    transactionDraft: TransactionDraft,
  ): Promise<TransactionResult> {
    try {
      return await SendToIotaContext(transactionDraft)
      // eslint-disable-next-line @typescript-eslint/no-explicit-any
    } catch (error: any) {
      if (error instanceof TransactionError) {
        return new TransactionResult(error)
      } else {
        throw error
      }
    }
  }
    */