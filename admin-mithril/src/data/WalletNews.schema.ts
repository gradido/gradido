// AI-GENERATED — not an architecture reference
import * as v from 'valibot'

/**
 * The answer to moderatorWalletNews: the wallet's three marks for the moderator's own account. The
 * support's and the contributions' part are null where the server could not count -- they never
 * fail the question.
 */
export const walletNewsSchema = v.object({
  walletChat: v.object({ unreadConversations: v.number() }),
  walletSupport: v.nullable(v.object({ inProgress: v.number() })),
  walletContributions: v.nullable(v.number()),
})
