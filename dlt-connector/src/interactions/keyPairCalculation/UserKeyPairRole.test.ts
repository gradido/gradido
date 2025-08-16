import { beforeAll, describe, expect, it } from 'bun:test'
import { KeyPairEd25519, MemoryBlock } from 'gradido-blockchain-js'
import { UserKeyPairRole } from './UserKeyPair.role'

let communityKeyPair: KeyPairEd25519
describe('UserKeyPairRole', () => {
  beforeAll(() => {
    communityKeyPair = KeyPairEd25519.create(new MemoryBlock('test').calculateHash())!
  })
  it('should generate key pair', () => {
    const userUUidPublicKeyPairs = [
      {
        userUuid: '648f28cc-209c-4696-b381-5156fc1a7bcb',
        publicKeyHex: 'ebd636d7e1e7177c0990d2ce836d8ced8b05ad75d62a7120a5d4a67bdd9dddb9',
      },
      {
        userUuid: 'fb65ef70-4c33-4dbc-aca8-3bae2609b04b',
        publicKeyHex: 'd89fe30c53852dc2c8281581e6904da396c3104fc11c0a6d9b4a0afa5ce54dc1',
      },
      {
        userUuid: 'd58b6355-a337-4c80-b593-18d78b5cdab0',
        publicKeyHex: 'dafb51eb8143cc7b2559235978ab845922ca8efa938ece078f45957ae3b92458',
      },
      {
        userUuid: '61144289-f69b-43a7-8b7d-5dcf3fa8ca68',
        publicKeyHex: '8d4db4ecfb65e40d1a4d4d4858be1ddd54b64aa845ceaa6698c336424ae0fc58',
      },
      {
        userUuid: 'c63e6870-196c-4013-b30a-d0a5170e8150',
        publicKeyHex: 'c240a8978da03f24d75108c4f06550a9bde46c902684a6d19d8b990819f518c8',
      },
      {
        userUuid: '6b40a2c9-4c0f-426d-bb55-353967e89aa2',
        publicKeyHex: '75531146e27b557085c09545e7a5e95f7bfd66d0de30c31befc34e4061f4e148',
      },
      {
        userUuid: '50c47820-6d15-449d-89c3-b1fd02674c80',
        publicKeyHex: '2c9ccb9914009bb6f24e41659223a5f8ce200cb5a4abdd808db57819f43c0ea2',
      },
      {
        userUuid: 'dc902954-bfc1-412e-b2f6-857e8bd45f0f',
        publicKeyHex: '4546870cf56093755c1f410a53c5908a5f30f26bc553110779e8bf5b841d904a',
      },
      {
        userUuid: 'd77cd665-0d60-4033-a887-07944466ccbe',
        publicKeyHex: '6563a5ca2944ba47391afd11a46e65bb7eb90657179dbc2d6be88af9ffa849a9',
      },
      {
        userUuid: 'ee83ed52-8a37-4a8a-8eed-ffaaac7d0d03',
        publicKeyHex: '03968833ee5d4839cb9091f39f76c9f5ca35f117b953229b59549cce907a60ea',
      },
    ]
    for (let i = 0; i < userUUidPublicKeyPairs.length; i++) {
      const pair = userUUidPublicKeyPairs[i]
      const userKeyPairRole = new UserKeyPairRole(pair.userUuid, communityKeyPair)
      const accountKeyPair = userKeyPairRole.generateKeyPair()
      expect(accountKeyPair).toBeDefined()
      const publicKeyHex = accountKeyPair.getPublicKey()?.convertToHex()
      expect(publicKeyHex).toHaveLength(64)
      expect(publicKeyHex).toBe(pair.publicKeyHex)
    }
  })
})
