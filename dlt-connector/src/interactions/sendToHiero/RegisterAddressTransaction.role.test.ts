import { describe, expect, it } from 'bun:test'
import { InteractionToJson, InteractionValidate, ValidateType_SINGLE } from 'gradido-blockchain-js'
import * as v from 'valibot'
import { transactionSchema } from '../../schemas/transaction.schema'
import { hieroIdSchema } from '../../schemas/typeGuard.schema'
import { RegisterAddressTransactionRole } from './RegisterAddressTransaction.role'

const userUuid = '408780b2-59b3-402a-94be-56a4f4f4e8ec'
const transaction = {
  user: {
    communityTopicId: '0.0.21732',
    account: {
      userUuid,
      accountNr: 0,
    },
  },
  type: 'REGISTER_ADDRESS',
  accountType: 'COMMUNITY_HUMAN',
  createdAt: '2022-01-01T00:00:00.000Z',
}

describe('RegisterAddressTransaction.role', () => {
  it('get correct prepared builder', async () => {
    const registerAddressTransactionRole = new RegisterAddressTransactionRole(
      v.parse(transactionSchema, transaction),
    )
    expect(registerAddressTransactionRole.getSenderCommunityTopicId()).toBe(
      v.parse(hieroIdSchema, '0.0.21732'),
    )
    expect(() => registerAddressTransactionRole.getRecipientCommunityTopicId()).toThrow()
    const builder = await registerAddressTransactionRole.getGradidoTransactionBuilder()
    const gradidoTransaction = builder.build()
    expect(() => new InteractionValidate(gradidoTransaction).run(ValidateType_SINGLE)).not.toThrow()
    const json = JSON.parse(new InteractionToJson(gradidoTransaction).run())
    expect(json.bodyBytes.json.registerAddress.nameHash).toBe(
      'bac2c06682808947f140d6766d02943761d4129ec055bb1f84dc3a4201a94c08',
    )
  })
})
