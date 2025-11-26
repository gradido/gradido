import { CommunityHandshakeState, CommunityHandshakeStateType } from 'database'
import { FEDERATION_AUTHENTICATION_TIMEOUT_MS } from 'shared'
import { CommunityHandshakeStateLogic } from './CommunityHandshakeState.logic'

describe('CommunityHandshakeStateLogic', () => {
  it('isTimeout', () => {
    const state = new CommunityHandshakeState()
    state.updatedAt = new Date(Date.now() - FEDERATION_AUTHENTICATION_TIMEOUT_MS * 2)
    state.status = CommunityHandshakeStateType.START_AUTHENTICATION
    const logic = new CommunityHandshakeStateLogic(state)
    expect(logic.isTimeout()).toEqual(true)
  })

  it('isTimeout return false', () => {
    const state = new CommunityHandshakeState()
    state.updatedAt = new Date(Date.now())
    state.status = CommunityHandshakeStateType.START_AUTHENTICATION
    const logic = new CommunityHandshakeStateLogic(state)
    expect(logic.isTimeout()).toEqual(false)
  })
})
