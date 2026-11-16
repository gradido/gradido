// AI-GENERATED — not an architecture reference
import { describe, expect, it } from 'bun:test'
import { markFigure, NO_WALLET_NEWS, walletNewsOf } from './WalletNews.logic'

const answer = (chat: number, support: number | null, contributions: number | null) => ({
  walletChat: { unreadConversations: chat },
  walletSupport: support === null ? null : { inProgress: support },
  walletContributions: contributions,
})

describe('walletNewsOf', () => {
  it('takes the three marks of an answer', () => {
    expect(walletNewsOf(NO_WALLET_NEWS, answer(2, 1, 3))).toEqual({
      chat: 2,
      support: 1,
      contributions: 3,
    })
  })

  it('takes a mark back to none', () => {
    expect(walletNewsOf({ chat: 2, support: 1, contributions: 3 }, answer(0, 0, 0))).toEqual(
      NO_WALLET_NEWS,
    )
  })

  // as in the wallet: a part the server could not count keeps what it was, the others go on
  it('keeps the support and the contributions where the server could not count them', () => {
    const before = { chat: 2, support: 1, contributions: 3 }
    expect(walletNewsOf(before, answer(4, null, 5))).toEqual({
      chat: 4,
      support: 1,
      contributions: 5,
    })
    expect(walletNewsOf(before, answer(4, 6, null))).toEqual({
      chat: 4,
      support: 6,
      contributions: 3,
    })
  })
})

describe('markFigure', () => {
  it('writes the number up to 99, then 99+', () => {
    expect(markFigure(1)).toBe('1')
    expect(markFigure(99)).toBe('99')
    expect(markFigure(100)).toBe('99+')
  })
})
