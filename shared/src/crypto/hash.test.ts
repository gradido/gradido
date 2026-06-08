import { describe, expect, it } from 'bun:test'
import { hashGeneric } from '.'

const communitySeed = 'a84bfff0cb3195357b03c0aeb90306da50bc88e73b9437a70cc8e7d6d091af40'

describe('hash', () => {
  it('hashGeneric', () => {
    expect(hashGeneric(communitySeed).toString('hex')).toBe(
      '2032a0d175ae01d934dd892c175bedd45232b7681aebd02b3595924cd9a8112e',
    )
  })
})
