import 'reflect-metadata'
import { hardenDerivationIndex } from '@/utils/derivationHelper'
import { uuid4ToBuffer } from '@/utils/typeConverter'

describe('controller/user', () => {
  const userUUID = '03857ac1-9cc2-483e-8a91-e5b10f5b8d16'
  it('test derivation preparations', () => {
    const wholeHex = uuid4ToBuffer(userUUID)
    expect(wholeHex).toEqual(Buffer.from('03857ac19cc2483e8a91e5b10f5b8d16', 'hex'))
    const indices = []
    for (let i = 0; i < 4; i++) {
      indices[i] = hardenDerivationIndex(wholeHex.subarray(i * 4, (i + 1) * 4).readUInt32BE())
    }
    expect(indices).toMatchObject([2206563009, 2629978174, 2324817329, 2405141782])
  })
})
