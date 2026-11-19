// AI-GENERATED — not an architecture reference
import type * as v from 'valibot'
import type { walletNewsSchema } from './WalletNews.schema'

/** The wallet's three marks, as the last answers counted them. */
export type WalletNews = { chat: number; support: number; contributions: number }

export const NO_WALLET_NEWS: WalletNews = { chat: 0, support: 0, contributions: 0 }

/** The marks after an answer: a part the server could not count keeps what it was, as in the wallet. */
export const walletNewsOf = (
  before: WalletNews,
  answer: v.InferOutput<typeof walletNewsSchema>,
): WalletNews => ({
  chat: answer.walletChat.unreadConversations,
  support: answer.walletSupport?.inProgress ?? before.support,
  contributions: answer.walletContributions ?? before.contributions,
})

/** The figure on the mark: the number up to 99, then "99+", as on the wallet's marks. */
export const markFigure = (count: number) => (count > 99 ? '99+' : String(count))
