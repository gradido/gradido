// AI-GENERATED — not an architecture reference
import { afterEach, beforeEach, describe, expect, it, spyOn } from 'bun:test'
import * as database from 'database'
import { ElysiaCustomStatusResponse } from 'elysia'
import { GradidoUnit } from 'shared'
import { ApiClientCompleted } from '../ApiClient'
import { disburseTransactionLink } from './disburseTransactionLink'
import * as senderSide from './senderSide'

// ⛔ spyOn, not mock.module: Bun cannot restore a module mock and core runs without --isolate.

const HOME = '1c8d7e6f-5a4b-4c3d-9e2f-1a0b9c8d7e6f'
const CALLER = '7a2e4c90-1b5d-4f3a-8c6e-0d9b3f2a1e47'
const OTHER = '3e1f0a9b-8c7d-4e6f-a5b4-c3d2e1f0a9b8'
const CODE = 'a1f9c2d41b7e19981fa0d001'

const found = {
  link: { id: 3, code: CODE, amount: GradidoUnit.fromString('20'), memo: 'Danke für die Suppe!' },
  creator: { id: 7, gradidoId: '4f9c1b2e-6d3a-4e8f-9b1c-2a7d5e0f3c61' },
}
const request = (link = { code: CODE, communityUuid: HOME }, recipientCommunityUuid = CALLER) => ({
  body: { link, recipient: { communityUuid: recipientCommunityUuid, identifier: 'peter' } },
  senderClient: { communityUuid: CALLER } as ApiClientCompleted,
})
const statusOf = (answer: unknown) => (answer as ElysiaCustomStatusResponse<number>).code

let spies: { mockRestore: () => void }[] = []
let linkSpy: ReturnType<typeof spyOn<typeof database, 'dbFindOpenTransactionLinkWithCreatorByCode'>>
let completeSpy: ReturnType<typeof spyOn<typeof senderSide, 'processXComCompleteTransaction'>>

beforeEach(() => {
  linkSpy = spyOn(database, 'dbFindOpenTransactionLinkWithCreatorByCode').mockResolvedValue(
    found as never,
  )
  completeSpy = spyOn(senderSide, 'processXComCompleteTransaction').mockResolvedValue(true)
  spies = [
    linkSpy,
    completeSpy,
    spyOn(database, 'getHomeCommunityDrizzle').mockResolvedValue({ communityUuid: HOME } as never),
  ]
})
afterEach(() => {
  for (const spy of spies) {
    spy.mockRestore()
  }
})

describe('disburseTransactionLink', () => {
  it('pays the link out from its maker, with what the link says, to the member named', async () => {
    expect(await disburseTransactionLink(request())).toBe(true)
    expect(completeSpy).toHaveBeenCalledWith(
      found.creator,
      CALLER,
      'peter',
      found.link.amount,
      found.link.memo,
      found.link,
    )
  })

  it('refuses a link of another community', async () => {
    expect(
      statusOf(await disburseTransactionLink(request({ code: CODE, communityUuid: OTHER }))),
    ).toBe(401)
    expect(completeSpy).not.toHaveBeenCalled()
  })

  it('refuses to pay out to a member of another community than the caller', async () => {
    expect(statusOf(await disburseTransactionLink(request(undefined, OTHER)))).toBe(401)
    expect(completeSpy).not.toHaveBeenCalled()
  })

  it('answers 404 where there is no open link with the code', async () => {
    linkSpy.mockResolvedValue(null)
    expect(statusOf(await disburseTransactionLink(request()))).toBe(404)
    expect(completeSpy).not.toHaveBeenCalled()
  })

  it('answers 500 with the words the transfer chose for the wallet', async () => {
    completeSpy.mockRejectedValue(new Error('TransactionLink is expired!'))
    const answer = await disburseTransactionLink(request())
    expect(statusOf(answer)).toBe(500)
    expect((answer as ElysiaCustomStatusResponse<number>).response).toBe(
      'TransactionLink is expired!',
    )
  })
})
