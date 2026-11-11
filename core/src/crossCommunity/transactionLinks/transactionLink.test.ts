// AI-GENERATED — not an architecture reference
import { afterEach, beforeEach, describe, expect, it, spyOn } from 'bun:test'
import * as database from 'database'
import { ElysiaCustomStatusResponse } from 'elysia'
import { GradidoUnit } from 'shared'
import * as pictureLogic from '../../logic/ThankYouGreetingPicture.logic'
import { transactionLink } from './transactionLink'

// ⛔ spyOn, not mock.module: Bun cannot restore a module mock and core runs without --isolate.

const HOME = '1c8d7e6f-5a4b-4c3d-9e2f-1a0b9c8d7e6f'
const MAKER = '4f9c1b2e-6d3a-4e8f-9b1c-2a7d5e0f3c61'
const CODE = 'a1f9c2d41b7e19981fa0d001'
const CREATED = new Date('2026-11-01T10:00:00.000Z')
const AVATAR = Buffer.from('the face of the maker')
const PICTURE = Buffer.from('the photo of the greeting')

const link = (changed: Record<string, unknown> = {}) => ({
  id: 3,
  code: CODE,
  userId: 7,
  amount: GradidoUnit.fromString('20'),
  memo: 'Danke für die Suppe!',
  createdAt: CREATED,
  validUntil: new Date(Date.now() + 24 * 60 * 60 * 1000),
  redeemedAt: null,
  redeemedBy: null,
  deletedAt: null,
  ...changed,
})
const found = (
  changed = {},
  greeting: object | null = { motif: 'sun', line: 'Danke', recipientName: 'Emma' },
) => ({
  link: link(changed),
  maker: { gradidoId: MAKER, communityUuid: HOME, alias: 'bibi' },
  greeting,
})
const photoGreeting = { motif: null, line: 'Danke', recipientName: null }
const statusOf = (answer: unknown) => (answer as ElysiaCustomStatusResponse<number>).code
const ask = () => transactionLink({ body: { code: CODE } })

let spies: { mockRestore: () => void }[] = []
let linkSpy: ReturnType<typeof spyOn<typeof database, 'dbFindTransactionLinkForCodeHolder'>>
let avatarSpy: ReturnType<typeof spyOn<typeof database, 'dbFindMemberAvatarsSmall'>>
let pictureSpy: ReturnType<typeof spyOn<typeof pictureLogic, 'thankYouGreetingPictureForCode'>>

beforeEach(() => {
  linkSpy = spyOn(database, 'dbFindTransactionLinkForCodeHolder').mockResolvedValue(
    found() as never,
  )
  avatarSpy = spyOn(database, 'dbFindMemberAvatarsSmall').mockResolvedValue([
    { gradidoId: MAKER, communityUuid: HOME, avatarSmall: AVATAR },
  ] as never)
  pictureSpy = spyOn(pictureLogic, 'thankYouGreetingPictureForCode').mockResolvedValue(PICTURE)
  spies = [linkSpy, avatarSpy, pictureSpy]
})
afterEach(() => {
  for (const spy of spies) {
    spy.mockRestore()
  }
})

describe('transactionLink', () => {
  it('answers an open link with its maker, greeting and face', async () => {
    expect(await ask()).toMatchObject({
      amount: GradidoUnit.fromString('20'),
      memo: 'Danke für die Suppe!',
      createdAt: CREATED,
      redeemedAt: null,
      deletedAt: null,
      sender: { gradidoId: MAKER, alias: 'bibi' },
      greeting: { motif: 'sun', line: 'Danke', recipientName: 'Emma' },
      senderAvatar: AVATAR.toString('base64'),
      picture: null,
    })
    expect(linkSpy).toHaveBeenCalledWith(CODE)
    // a greeting with a motif carries no photo: none is read
    expect(pictureSpy).not.toHaveBeenCalled()
  })

  it('answers the photo of a greeting that carries one', async () => {
    linkSpy.mockResolvedValue(found({}, photoGreeting) as never)
    expect((await ask()) as { picture: string }).toMatchObject({
      picture: PICTURE.toString('base64'),
    })
  })

  // ⛔ What became of the link, and nothing more: no face of a link that is not open.
  it('answers a redeemed link without the face', async () => {
    linkSpy.mockResolvedValue(found({ redeemedAt: CREATED, redeemedBy: 9 }) as never)
    expect(await ask()).toMatchObject({ redeemedAt: CREATED, senderAvatar: null })
    expect(avatarSpy).not.toHaveBeenCalled()
  })

  // ⛔ What was taken back shows nothing any more: no greeting, so no photo either.
  it('answers a deleted link without greeting, face and photo', async () => {
    linkSpy.mockResolvedValue(found({ deletedAt: CREATED }, photoGreeting) as never)
    expect(await ask()).toMatchObject({ greeting: null, senderAvatar: null, picture: null })
    expect(pictureSpy).not.toHaveBeenCalled()
  })

  it('answers the link without the face where the face cannot be read', async () => {
    avatarSpy.mockRejectedValue(new Error('read ECONNRESET'))
    expect(await ask()).toMatchObject({ memo: 'Danke für die Suppe!', senderAvatar: null })
  })

  it('answers 404 for an unknown code', async () => {
    linkSpy.mockResolvedValue(null)
    expect(statusOf(await ask())).toBe(404)
  })
})
