import { AddressType } from '@/data/proto/3_3/enum/AddressType'
import { LogError } from '@/server/LogError'

import { create } from './Account'

describe('controller/Account', () => {
  it("test createAccount if provided public key hasn't expected length", () => {
    expect(() =>
      create(Buffer.from('43ef5143fdc'), AddressType.COMMUNITY_HUMAN, new Date(), 1),
    ).toThrow(new LogError('invalid public key size'))
  })
})
