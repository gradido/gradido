// AI-GENERATED — not an architecture reference
import { cleanDB, testEnvironment } from '@test/helpers'
import { ApolloServerTestClient } from 'apollo-server-testing'
import { EncryptedTransferArgs } from 'core'
import { AppDatabase, Community as DbCommunity, User as DbUser, userAvatarsTable } from 'database'
import { getLogger } from 'log4js'
import {
  createKeyPair,
  encryptAndSign,
  JwtPayloadType,
  MemberAvatarsJwtPayloadType,
  MemberAvatarsKind,
  MemberAvatarsResponseJwtPayloadType,
  verifyAndDecrypt,
} from 'shared'
import { DataSource } from 'typeorm'
import { CONFIG } from '@/config'
import { getApiResolvers as getApiResolvers_1_1 } from '../../1_1/schema'
import { MemberAvatarsResolver } from './MemberAvatarsResolver'

let query: ApolloServerTestClient['query']
let testEnv: {
  mutate: ApolloServerTestClient['mutate']
  query: ApolloServerTestClient['query']
  con: DataSource
}

CONFIG.FEDERATION_API = '1_0'

const HOME_UUID = '56a55482-909e-46a4-bfa2-cd025e894eba'
const PEER_UUID = '56a55482-909e-46a4-bfa2-cd025e894ebb'
const SHOWN = 'a1a1a1a1-0000-4000-8000-000000000001'
const SWITCHED_OFF = 'a1a1a1a1-0000-4000-8000-000000000002'
const MIRRORED = 'a1a1a1a1-0000-4000-8000-000000000003'
const UNKNOWN = 'a1a1a1a1-0000-4000-8000-000000000009'

// Not real JPEGs, only distinguishable bytes: small and full differ, so an answer that took
// the wrong column cannot pass.
const small = Buffer.from([0xff, 0xd8, 0xff, 0xe0, 0x01, 0x02])
const full = Buffer.from([0xff, 0xd8, 0xff, 0xe0, 0x11, 0x12, 0x13, 0x14])
const updatedAt = new Date('2026-09-10T08:00:00.000Z')

let homeCom: DbCommunity
let peerCom: DbCommunity

beforeAll(async () => {
  testEnv = await testEnvironment(getLogger('apollo'))
  query = testEnv.query
  await cleanDB()
})

afterAll(async () => {
  await cleanDB()
  if (testEnv.con?.isInitialized) {
    await AppDatabase.getInstance().destroy()
  }
})

const createCommunity = async (
  foreign: boolean,
  publicKeyHex: string,
  communityUuid: string,
): Promise<DbCommunity> => {
  const { publicKey, privateKey } = await createKeyPair()
  const community = DbCommunity.create()
  community.foreign = foreign
  // `name` is varchar(40), a uuid with a suffix does not fit.
  community.url = foreign ? 'peerCom-url' : 'homeCom-url'
  community.name = foreign ? 'peerCom-Name' : 'homeCom-Name'
  community.description = foreign ? 'peerCom-Description' : 'homeCom-Description'
  community.creationDate = new Date()
  community.publicKey = Buffer.from(publicKeyHex, 'hex')
  community.publicJwtKey = publicKey
  // The peer's private key is kept here only because the test plays the peer as well.
  community.privateJwtKey = privateKey
  community.communityUuid = communityUuid
  await DbCommunity.insert(community)
  return community
}

const createMemberWithPicture = async (
  gradidoID: string,
  { foreign = false, visible = true }: { foreign?: boolean; visible?: boolean } = {},
): Promise<void> => {
  const user = DbUser.create()
  user.gradidoID = gradidoID
  user.communityUuid = foreign ? PEER_UUID : HOME_UUID
  user.foreign = foreign
  user.avatarVisibleToMembers = visible
  user.alias = `m${gradidoID.slice(-3)}`
  user.firstName = 'first'
  user.lastName = 'last'
  await DbUser.insert(user)
  await AppDatabase.getInstance().getDrizzleDataSource().insert(userAvatarsTable).values({
    userId: user.id,
    avatarSmall: small,
    avatarFull: full,
    mimeType: 'image/jpeg',
    updatedAt,
  })
}

const memberAvatarsQuery = `
  query ($args: EncryptedTransferArgs!) {
    memberAvatars(data: $args)
  }`

/** Asks the way the other community does: signed as the peer, encrypted for this community. */
const ask = async (
  payload: JwtPayloadType,
  signer: { publicKeyHex: string; privateJwtKey: string } = {
    publicKeyHex: peerCom.publicKey.toString('hex'),
    privateJwtKey: peerCom.privateJwtKey!,
  },
) => {
  const args = new EncryptedTransferArgs()
  args.handshakeID = 'handshakeID'
  args.publicKey = signer.publicKeyHex
  args.jwt = await encryptAndSign(payload, signer.privateJwtKey, homeCom.publicJwtKey!)
  return await query({ query: memberAvatarsQuery, variables: { args } })
}

const askFor = (kind: MemberAvatarsKind, gradidoIDs: string[]) =>
  ask(new MemberAvatarsJwtPayloadType('handshakeID', kind, gradidoIDs))

/** Opens the answer the way the peer would: with its own private key, checking our signature. */
const openAnswer = async (response: Awaited<ReturnType<typeof ask>>) => {
  expect(response.errors).toBeUndefined()
  return (await verifyAndDecrypt(
    'handshakeID',
    response.data.memberAvatars,
    peerCom.privateJwtKey!,
    homeCom.publicJwtKey!,
  )) as MemberAvatarsResponseJwtPayloadType
}

const refusal = (response: Awaited<ReturnType<typeof ask>>) => response.errors?.[0]?.message

describe('MemberAvatarsResolver', () => {
  beforeEach(async () => {
    await cleanDB()
    homeCom = await createCommunity(
      false,
      '15F92F8EC2EA685D5FD51EE3588F5B4805EBD330EF9EDD16043F3BA9C35C0D91',
      HOME_UUID,
    )
    peerCom = await createCommunity(
      true,
      '15F92F8EC2EA685D5FD51EE3588F5B4805EBD330EF9EDD16043F3BA9C35C0D92',
      PEER_UUID,
    )
    await createMemberWithPicture(SHOWN)
    await createMemberWithPicture(SWITCHED_OFF, { visible: false })
    // ⛔ The mirror row this community keeps for a member of the PEER, with a picture row
    // forced onto it -- a state production cannot reach, built so that the rule has to
    // refuse it: a community hands out its own members, never somebody else's. For `small`
    // and `dates`, which look up by id alone, only the `foreign = 0` term does.
    await createMemberWithPicture(MIRRORED, { foreign: true })
  })

  describe('kind small', () => {
    it('hands out the small picture and its date of a member who allows it', async () => {
      const answer = await openAnswer(await askFor('small', [SHOWN]))

      expect(answer.tokentype).toBe(
        MemberAvatarsResponseJwtPayloadType.MEMBER_AVATARS_RESPONSE_TYPE,
      )
      expect(answer.members).toEqual([
        {
          gradidoID: SHOWN,
          avatarUpdatedAt: updatedAt.toISOString(),
          avatar: small.toString('base64'),
        },
      ])
    })

    it('hands out nothing for a member who switched it off', async () => {
      expect((await openAnswer(await askFor('small', [SWITCHED_OFF]))).members).toEqual([])
    })

    it('hands out nothing for the mirror row of another community member', async () => {
      expect((await openAnswer(await askFor('small', [MIRRORED]))).members).toEqual([])
    })

    // One answer for "not allowed" and "no such member", and neither is an error.
    it('answers a mixed list with only the member who allows it', async () => {
      const answer = await openAnswer(
        await askFor('small', [SHOWN, SWITCHED_OFF, MIRRORED, UNKNOWN]),
      )
      expect(answer.members.map((member) => member.gradidoID)).toEqual([SHOWN])
    })
  })

  describe('kind dates', () => {
    it('hands out the date without picture data', async () => {
      const answer = await openAnswer(await askFor('dates', [SHOWN, SWITCHED_OFF, MIRRORED]))

      expect(answer.members).toEqual([
        { gradidoID: SHOWN, avatarUpdatedAt: updatedAt.toISOString(), avatar: null },
      ])
    })
  })

  describe('kind full', () => {
    it('hands out the full picture of one member who allows it', async () => {
      const answer = await openAnswer(await askFor('full', [SHOWN]))

      expect(answer.members).toEqual([
        {
          gradidoID: SHOWN,
          avatarUpdatedAt: updatedAt.toISOString(),
          avatar: full.toString('base64'),
        },
      ])
    })

    it('hands out nothing for a member who switched it off', async () => {
      expect((await openAnswer(await askFor('full', [SWITCHED_OFF]))).members).toEqual([])
    })

    // Refused twice over here: the date lookup carries `foreign = 0`, and the crop is read by
    // the pair with THIS community's uuid, which a mirror row does not carry.
    it('hands out nothing for the mirror row of another community member', async () => {
      expect((await openAnswer(await askFor('full', [MIRRORED]))).members).toEqual([])
    })

    it('refuses two members at once', async () => {
      expect(refusal(await askFor('full', [SHOWN, SWITCHED_OFF]))).toBe(
        'memberAvatars refused: kind full takes exactly one gradidoID',
      )
    })
  })

  describe('protocol violations, which are about the peer and never about a member', () => {
    it('refuses more members than one list may name', async () => {
      const ids = Array.from(
        { length: 101 },
        (_, n) => `b2b2b2b2-0000-4000-8000-${String(n).padStart(12, '0')}`,
      )
      expect(refusal(await askFor('small', ids))).toBe(
        'memberAvatars refused: too many gradidoIDs at once',
      )
    })

    // The boundary itself is allowed, so the cap above cannot be a lower number that
    // happens to refuse 101 as well.
    it('accepts exactly as many members as one list may name', async () => {
      const ids = Array.from({ length: 100 }, (_, n) =>
        n === 0 ? SHOWN : `b2b2b2b2-0000-4000-8000-${String(n).padStart(12, '0')}`,
      )
      const answer = await openAnswer(await askFor('small', ids))
      expect(answer.members.map((member) => member.gradidoID)).toEqual([SHOWN])
    })

    it('refuses a kind the protocol does not know', async () => {
      const payload = new MemberAvatarsJwtPayloadType('handshakeID', 'small', [SHOWN])
      ;(payload as JwtPayloadType).kind = 'everything'
      expect(refusal(await ask(payload))).toBe('memberAvatars refused: unknown kind')
    })

    it('refuses a list that is not a list of ids', async () => {
      const payload = new MemberAvatarsJwtPayloadType('handshakeID', 'small', [SHOWN])
      ;(payload as JwtPayloadType).gradidoIDs = SHOWN
      expect(refusal(await ask(payload))).toBe(
        'memberAvatars refused: gradidoIDs is not a list of strings',
      )
    })

    // A token written for a different question, signed and encrypted correctly. Only the
    // tokentype tells the two apart.
    it('refuses a token of another type', async () => {
      const payload = new MemberAvatarsJwtPayloadType('handshakeID', 'small', [SHOWN])
      payload.tokentype = MemberAvatarsResponseJwtPayloadType.MEMBER_AVATARS_RESPONSE_TYPE
      expect(refusal(await ask(payload))).toBe('memberAvatars refused: unexpected tokentype')
    })

    it('refuses a community it does not know', async () => {
      const stranger = await createKeyPair()
      const response = await ask(new MemberAvatarsJwtPayloadType('handshakeID', 'small', [SHOWN]), {
        publicKeyHex: '15F92F8EC2EA685D5FD51EE3588F5B4805EBD330EF9EDD16043F3BA9C35C0D93',
        privateJwtKey: stranger.privateKey,
      })
      expect(refusal(response)).toContain('unknown requesting community')
    })

    // A known community's public key with somebody else's signature: the envelope does not
    // verify against the key this community holds for the peer.
    it('refuses a known community name signed with another key', async () => {
      const stranger = await createKeyPair()
      const response = await ask(new MemberAvatarsJwtPayloadType('handshakeID', 'small', [SHOWN]), {
        publicKeyHex: peerCom.publicKey.toString('hex'),
        privateJwtKey: stranger.privateKey,
      })
      expect(refusal(response)).toContain('invalid payload of community')
    })
  })

  it('is served by API 1_1 as well', () => {
    expect(getApiResolvers_1_1()).toContain(MemberAvatarsResolver)
  })
})
