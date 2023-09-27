import 'reflect-metadata'
import { CommunityDraft } from '@/graphql/input/CommunityDraft'
import { CONFIG } from '@/config'
import { entropyToMnemonic, mnemonicToSeedSync } from 'bip39'
import { generateFromSeed, toPublic, derivePrivate } from 'bip32-ed25519'
import { AddressType } from '@proto/3_3/enum/AddressType'
import { iotaTopicFromCommunityUUID } from '@/utils/typeConverter'
import { TestDB } from '@test/TestDB'
import { create as createCommunity, findAll, isExist } from './Community'
import { getDataSource } from '@/typeorm/DataSource'
import { Community } from '@entity/Community'

const rootKeysSeed = 'aabbccddeeff00112233445566778899aabbccddeeff00112233445566778899'
CONFIG.IOTA_HOME_COMMUNITY_SEED = rootKeysSeed

jest.mock('@typeorm/DataSource', () => ({
  getDataSource: () => TestDB.instance.dbConnect,
}))

describe('controller/Community', () => {
  beforeAll(async () => {
    await TestDB.instance.setupTestDB()
    // apolloTestServer = await createApolloTestServer()
  })

  afterAll(async () => {
    await TestDB.instance.teardownTestDB()
  })

  // generate Home Community Extended Private Key manually to check if intern correct functions are called
  const mnemonic = entropyToMnemonic(rootKeysSeed)
  const seed = mnemonicToSeedSync(mnemonic)

  const extendedPrivateKey: Buffer = generateFromSeed(seed)
  const privateKey = extendedPrivateKey.subarray(0, 64)
  const chainCode = extendedPrivateKey.subarray(64, 96)
  const publicKey = toPublic(extendedPrivateKey).subarray(0, 32)

  it('check if generated keys a still like expected', () => {
    expect(publicKey).toEqual(
      Buffer.from('a11717e17fc1f7a1004cc2757802f22e304dd252bfcc39849d722ef18e3738f5', 'hex'),
    )
    expect(privateKey).toEqual(
      Buffer.from(
        '287399ff0eb3d5c7fea6800dfc88be39bc4374380168b9b23455fcba75b8d856f8c0e255301832b2af7a735323470d4f45530981abfa38f23fa45f24ac6be5ad',
        'hex',
      ),
    )
    expect(chainCode).toEqual(
      Buffer.from('8373448c95d8b5753115ec319a7bacb4c7c10d4ef2b8ce66301230563f230bf4', 'hex'),
    )
  })

  // derive special accounts key manually to check if intern correct functions are called
  // 2147483649 => 1'
  const derivedGMWExtendedPrivateKey = derivePrivate(extendedPrivateKey, 2147483649)
  const derivedGMWPublicKey = toPublic(derivedGMWExtendedPrivateKey).subarray(0, 32)

  // 2147483650 => 2'
  const derivedAufExtendedPrivateKey = derivePrivate(extendedPrivateKey, 2147483650)
  const derivedAufPublicKey = toPublic(derivedAufExtendedPrivateKey).subarray(0, 32)

  it('check if key derivation for auf and gmw still work like expected', () => {
    expect(derivedGMWPublicKey).toEqual(
      Buffer.from('cf98844e278182918397dec822aa311bb89c9617043fbf3f3125c6d04fe7bd58', 'hex'),
    )
    expect(derivedAufPublicKey).toEqual(
      Buffer.from('e70dd1d5d3554aabf9497e47ba97b5dbd7c3653467b51b0b8abc3f368a2da195', 'hex'),
    )
  })

  describe('createCommunity', () => {
    it('valid community', async () => {
      const communityDraft = new CommunityDraft()
      communityDraft.foreign = false
      communityDraft.createdAt = '2022-05-01T17:00:12.128Z'
      communityDraft.uuid = '3d813cbb-47fb-32ba-91df-831e1593ac29'

      const iotaTopic = iotaTopicFromCommunityUUID(communityDraft.uuid)
      expect(iotaTopic).toEqual('204ef6aed15fbf0f9da5819e88f8eea8e3adbe1e2c2d43280780a4b8c2d32b56')

      const createdAtDate = new Date(communityDraft.createdAt)
      const communityEntity = createCommunity(communityDraft)
      expect(communityEntity).toMatchObject({
        iotaTopic,
        createdAt: createdAtDate,
        foreign: false,
        rootPubkey: publicKey,
        rootPrivkey: privateKey,
        rootChaincode: chainCode,
        gmwAccount: {
          derivationIndex: 2147483649,
          derive2Pubkey: derivedGMWPublicKey,
          type: AddressType.COMMUNITY_GMW,
          createdAt: createdAtDate,
        },
        aufAccount: {
          derivationIndex: 2147483650,
          derive2Pubkey: derivedAufPublicKey,
          type: AddressType.COMMUNITY_AUF,
          createdAt: createdAtDate,
        },
      })
      await getDataSource().manager.save(communityEntity)
    })
  })

  describe('list communities', () => {
    it('get all topics', async () => {
      expect(await findAll({ iotaTopic: true })).toMatchObject([
        {
          iotaTopic: '204ef6aed15fbf0f9da5819e88f8eea8e3adbe1e2c2d43280780a4b8c2d32b56',
        },
      ])
    })

    it('isExist with communityDraft', async () => {
      const communityDraft = new CommunityDraft()
      communityDraft.foreign = false
      communityDraft.createdAt = '2022-05-01T17:00:12.128Z'
      communityDraft.uuid = '3d813cbb-47fb-32ba-91df-831e1593ac29'
      expect(await isExist(communityDraft)).toBe(true)
    })

    it('createdAt with ms precision', async () => {
      const list = await Community.findOne({ where: { foreign: false } })
      expect(list).toMatchObject({
        createdAt: new Date('2022-05-01T17:00:12.128Z'),
      })
    })
  })
})
