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
        publicKeyHex: '6f5877a718b1ac1947d5aa4b963f92b575888f526d1a47b4d6a4a5d5def2640c',
      },
      {
        userUuid: 'fb65ef70-4c33-4dbc-aca8-3bae2609b04b',
        publicKeyHex: 'ee4ef8032201ee7db4b5fd8f9bcb89f33f1c96b5aa56b21e36720ac246d513b6',
      },
      {
        userUuid: 'd58b6355-a337-4c80-b593-18d78b5cdab0',
        publicKeyHex: '44ef1b8303d5da560e6d0624a9a739dccc7690f0e1c7bd41a07b1366b57e51bc',
      },
      {
        userUuid: '61144289-f69b-43a7-8b7d-5dcf3fa8ca68',
        publicKeyHex: '951071274bcfa3c7a0fe463f8c5309322af81c4ac9cb947759e719fc6a45fbca',
      },
      {
        userUuid: 'c63e6870-196c-4013-b30a-d0a5170e8150',
        publicKeyHex: 'dc35ca7ddf5e651af3518396b13e5eedf113754c23642d3a4d8b19bccbe5b763',
      },
      {
        userUuid: '6b40a2c9-4c0f-426d-bb55-353967e89aa2',
        publicKeyHex: 'ad5b2fcea1c3af4774875fdf1145becc4c1f086629b48ba07fde7b649ef8539e',
      },
      {
        userUuid: '50c47820-6d15-449d-89c3-b1fd02674c80',
        publicKeyHex: '4496805fea48ae0e34786b2411fc45daa7edbf517e943714ec3b623739c4f2d5',
      },
      {
        userUuid: 'dc902954-bfc1-412e-b2f6-857e8bd45f0f',
        publicKeyHex: '17b8348a58f6767de7e8d554cd15997f72e1daebbb5b62660b8de7339fa9dd78',
      },
      {
        userUuid: 'd77cd665-0d60-4033-a887-07944466ccbe',
        publicKeyHex: 'eea8cc84519c1fb813cfbdd9d8a9be82c7bad447c0bc3ad7397d3c5572fa2290',
      },
      {
        userUuid: 'ee83ed52-8a37-4a8a-8eed-ffaaac7d0d03',
        publicKeyHex: 'f0083dbc46e5d649e00bd3e3e2170429a5b50402f840b7eee3bdc353c2be4b64',
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
