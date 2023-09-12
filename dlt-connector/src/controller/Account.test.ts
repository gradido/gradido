import { LogError } from '@/server/LogError'
import { createAccount } from './Account'
import { AddressType } from '@/proto/3_3/enum/AddressType'

describe('controller/Account', () => {
  it("test createAccount if provided public key hasn't expected length", () => {
    expect(() =>
      createAccount(1, Buffer.from('43ef5143fdc'), AddressType.COMMUNITY_HUMAN, new Date()),
    ).toThrow(new LogError('invalid public key size'))
  })
})
