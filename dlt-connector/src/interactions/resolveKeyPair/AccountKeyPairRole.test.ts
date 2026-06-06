import { beforeAll, describe, expect, it } from 'bun:test'
import { KeyPairEd25519, MemoryBlock } from 'gradido-blockchain-js'
import { AccountKeyPairRole } from './AccountKeyPair.role'
import { UserKeyPairRole } from './UserKeyPair.role'

let communityKeyPair: KeyPairEd25519
describe('UserKeyPairRole', () => {
  beforeAll(() => {
    const communityRootSeed = new MemoryBlock('test').calculateHash()
    console.log(`communityRootSeed: ${communityRootSeed.convertToHex()}`)
    communityKeyPair = KeyPairEd25519.create(communityRootSeed)!
  })
  it('should generate key pair', () => {
    const userUUidPublicKeyPairs = [
      { "userUuid": "648f28cc-209c-4696-b381-5156fc1a7bcb", "userPublicKeyHex": "6f5877a718b1ac1947d5aa4b963f92b575888f526d1a47b4d6a4a5d5def2640c", "accountPublicKeyHex": "4138b9b4c444a3b690401c93e2fd948ca9a8e5437a94907be2cfa67993a4a402" },
      { "userUuid": "fb65ef70-4c33-4dbc-aca8-3bae2609b04b", "userPublicKeyHex": "ee4ef8032201ee7db4b5fd8f9bcb89f33f1c96b5aa56b21e36720ac246d513b6", "accountPublicKeyHex": "562929fd4167505543bbbd8a9cdb0ddd35919451b8b71b79e106898b114dfbae" },
      { "userUuid": "d58b6355-a337-4c80-b593-18d78b5cdab0", "userPublicKeyHex": "44ef1b8303d5da560e6d0624a9a739dccc7690f0e1c7bd41a07b1366b57e51bc", "accountPublicKeyHex": "1f772efd0eb8cf8cc8475aea16282efa23acae2f1298f5592db68feffecc8e31" },
      { "userUuid": "61144289-f69b-43a7-8b7d-5dcf3fa8ca68", "userPublicKeyHex": "951071274bcfa3c7a0fe463f8c5309322af81c4ac9cb947759e719fc6a45fbca", "accountPublicKeyHex": "793ef29d76de55e25c2a420c0fc1e77e830b7c54fa1f01b331bdbf19791c8d2c" },
      { "userUuid": "c63e6870-196c-4013-b30a-d0a5170e8150", "userPublicKeyHex": "dc35ca7ddf5e651af3518396b13e5eedf113754c23642d3a4d8b19bccbe5b763", "accountPublicKeyHex": "01508024238008b2999651505f64500c1d0dc7121cc613f71a3e7a30966a109e" },
      { "userUuid": "6b40a2c9-4c0f-426d-bb55-353967e89aa2", "userPublicKeyHex": "ad5b2fcea1c3af4774875fdf1145becc4c1f086629b48ba07fde7b649ef8539e", "accountPublicKeyHex": "5ab2542c11b4287412f2d33c021eb23a9a6f8f1340f60a9782e318541ee34ceb" },
      { "userUuid": "50c47820-6d15-449d-89c3-b1fd02674c80", "userPublicKeyHex": "4496805fea48ae0e34786b2411fc45daa7edbf517e943714ec3b623739c4f2d5", "accountPublicKeyHex": "383d2a918803eeea0e2c24ebff6e4cee6ede058792ab34fc08f2111aad3e1082" },
      { "userUuid": "dc902954-bfc1-412e-b2f6-857e8bd45f0f", "userPublicKeyHex": "17b8348a58f6767de7e8d554cd15997f72e1daebbb5b62660b8de7339fa9dd78", "accountPublicKeyHex": "0b7d99e5fff89f8eea3bba151155b32dc157299ad0a915d7e6c3a385efc27a63" },
      { "userUuid": "d77cd665-0d60-4033-a887-07944466ccbe", "userPublicKeyHex": "eea8cc84519c1fb813cfbdd9d8a9be82c7bad447c0bc3ad7397d3c5572fa2290", "accountPublicKeyHex": "a79225f4ba264c0b7715bf0e214127e577e714f2bcc4adc464b69122d400cde2" },
      { "userUuid": "ee83ed52-8a37-4a8a-8eed-ffaaac7d0d03", "userPublicKeyHex": "f0083dbc46e5d649e00bd3e3e2170429a5b50402f840b7eee3bdc353c2be4b64", "accountPublicKeyHex": "71206913d8c81d008eb4a6480557c95fd30a3bfb36621b6bb27190095f552f63" }
    ]
    for (let i = 0; i < userUUidPublicKeyPairs.length; i++) {
      const pair = userUUidPublicKeyPairs[i]
      const userKeyPairRole = new UserKeyPairRole(pair.userUuid, communityKeyPair)
      const userKeyPair = userKeyPairRole.generateKeyPair()
      expect(userKeyPair).toBeDefined()
      const userPublicKeyHex = userKeyPair.getPublicKey()?.convertToHex()
      expect(userPublicKeyHex).toHaveLength(64)
      expect(userPublicKeyHex).toBe(pair.userPublicKeyHex)

      const accountKeyPairRole = new AccountKeyPairRole(1, userKeyPair)
      const accountKeyPair = accountKeyPairRole.generateKeyPair()
      const accountPublicKeyHex = accountKeyPair.getPublicKey()?.convertToHex()
      expect(accountPublicKeyHex).toHaveLength(64)
      expect(accountPublicKeyHex).toBe(pair.accountPublicKeyHex)
      
    }
  })
})
