// AI-GENERATED — not an architecture reference
import { beforeEach, describe, expect, it } from 'bun:test'
import * as v from 'valibot'
import { otherTabStores } from '../../test/browserStub'
import { BIBI, BOB, member } from '../../test/member'

const { DeviceStoreBasicType } = await import('./DeviceStore')
const { MemberStore } = await import('./MemberStore')
const { login, session } = await import('./Session')

const windowLarge = new MemberStore(
  'chat-window-large',
  v.fallback(
    v.pipe(
      v.string(),
      v.transform((kept) => kept === '1'),
    ),
    false,
  ),
  DeviceStoreBasicType.String,
)

beforeEach(() => {
  localStorage.clear()
  session.set(undefined, false)
})

describe('MemberStore', () => {
  it('throws where nobody is signed in', () => {
    expect(() => windowLarge.forSignedInMember()).toThrow('chat-window-large is kept for a member')
  })

  it('reads what the device keeps for the member signed in, each under their own key', () => {
    localStorage.setItem(`chat-window-large:${BIBI}`, '1')
    login(member(BIBI))
    expect(windowLarge.forSignedInMember().key).toBe(`chat-window-large:${BIBI}`)
    expect(windowLarge.forSignedInMember().state).toBe(true)
    login(member(BOB))
    expect(windowLarge.forSignedInMember().state).toBe(false)
  })

  it('is one store to a key, which hears another tab', () => {
    login(member(BIBI))
    const store = windowLarge.forSignedInMember()
    expect(windowLarge.forSignedInMember()).toBe(store)
    otherTabStores(`chat-window-large:${BIBI}`, '1')
    expect(store.state).toBe(true)
  })

  it('names what a value is kept for behind the ID, each part after a colon', () => {
    login(member(BIBI))
    expect(windowLarge.forSignedInMember('overview').key).toBe(`chat-window-large:${BIBI}:overview`)
    expect(windowLarge.forSignedInMember('overview')).not.toBe(windowLarge.forSignedInMember())
    expect(windowLarge.forSignedInMember('thanks', '7').key).toBe(
      `chat-window-large:${BIBI}:thanks:7`,
    )
  })
})
