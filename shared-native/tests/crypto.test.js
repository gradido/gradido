const { describe, it } = require('node:test')
const { strict } = require("node:assert")
const assert = strict
const { signKeyPairDeriveAccountFromCommunity } = require('../')

const communitySeed = 'a84bfff0cb3195357b03c0aeb90306da50bc88e73b9437a70cc8e7d6d091af40'
const userUuid = '693efa00-c553-42c6-a8ab-d194a8962242'

describe('Crypto', () => {
  describe('ed25519', () => {
    it('full key pair derivation 1k times', () => {
      for (let i = 0; i < 1000; i++) {
        const communityRootSeedRaw = new Uint8Array(Buffer.from(communitySeed, 'hex'))
        const userUuidRaw = new Uint8Array(Buffer.from(userUuid.replace(/-/g, ''), 'hex'))
        const result = signKeyPairDeriveAccountFromCommunity(communityRootSeedRaw, userUuidRaw);
        assert(result.length === 96, 'result should be 96 bytes')
      }
    })
  })
})
