// AI-GENERATED — not an architecture reference
import { transferPersonKey } from './ChatTransfers.logic'

const HOME = '11111111-1111-4111-8111-111111111111'
const LENA = { communityUuid: HOME, gradidoId: 'aaaaaaaa-aaaa-4aaa-8aaa-aaaaaaaaaaaa' }
const MAX = { communityUuid: HOME, gradidoId: 'bbbbbbbb-bbbb-4bbb-8bbb-bbbbbbbbbbbb' }
const shouting = (pair: { communityUuid: string; gradidoId: string }) => ({
  communityUuid: pair.communityUuid.toUpperCase(),
  gradidoId: pair.gradidoId.toUpperCase(),
})

describe('transferPersonKey', () => {
  it('is one key for one person, however the pair is spelled', () => {
    expect(transferPersonKey(shouting(LENA))).toBe(transferPersonKey(LENA))
    expect(transferPersonKey(MAX)).not.toBe(transferPersonKey(LENA))
  })
})
