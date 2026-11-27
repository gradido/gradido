// AI-GENERATED — not an architecture reference
import { beforeEach, describe, expect, it, mock } from 'bun:test'
import '../../test/browserStub'
import { BIBI, member } from '../../test/member'

const request = mock((..._asked: unknown[]) =>
  Promise.resolve({ success: true, value: { updateUserInfos: true } }),
)
mock.module('@/graphql/client', () => ({ request }))
// whether the language is shown, or another choice came while its texts did
let applied = true
mock.module('@/i18n', () => ({ setLocale: mock(() => Promise.resolve(applied)) }))

const { signInAs } = await import('./signIn')
const { session } = await import('./Session')

beforeEach(() => {
  request.mockClear()
  session.set({ ...session.state, member: null, language: 'fr', preLoginLanguage: 'fr' })
})

describe('signInAs', () => {
  it('saves to the account the language chosen before', async () => {
    applied = true
    await signInAs({ ...member(BIBI), language: 'de' })
    expect(session.state.member?.gradidoID).toBe(BIBI)
    expect(request).toHaveBeenCalledTimes(1)
    expect(request.mock.calls[0][1]).toEqual({ locale: 'fr' })
  })

  it('saves nothing where another language was chosen meanwhile: that choice saves itself', async () => {
    applied = false
    await signInAs({ ...member(BIBI), language: 'de' })
    expect(session.state.member?.gradidoID).toBe(BIBI)
    expect(request).not.toHaveBeenCalled()
  })
})
