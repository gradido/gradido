// AI-GENERATED — not an architecture reference
import type { Page } from '@playwright/test'
import type { Answer } from './graphql'

export const moderator = {
  firstName: 'Peter',
  lastName: 'Lustig',
  alias: 'peter',
  role: 'ADMIN',
  gradidoID: 'a6c9b4a2-0f2b-4b8e-9f43-3c3c1b1e9d01',
  communityUuid: '2d7f7a1e-6b8e-4a0a-9c3e-8f1f6a2b9c11',
  language: 'de',
  avatar: null,
  avatarColorIndex: null,
  visibleCreationGroups: [] as string[],
  seesAllCreationGroups: true,
  seesUntagged: true,
  // an administrator handles support requests; a copy with role MODERATOR keeps it, as a
  // moderator with the tick (Support-Anfragen K6)
  handlesSupportTickets: true,
}

const base64Url = (value: object) => Buffer.from(JSON.stringify(value)).toString('base64url')

/** A token the admin reads its subject from; the signature is never checked in the browser. */
export const tokenFor = (gradidoID: string) =>
  `${base64Url({ alg: 'HS256', typ: 'JWT' })}.${base64Url({ sub: gradidoID })}.signature`

/**
 * The questions the bar asks on every page of the Mithril admin, in the background and every
 * fifteen seconds: what waits in the moderator's own wallet (walletNews.store). A test that names
 * the questions of its page leaves these out.
 */
export const WALLET_NEWS_FIELDS = ['walletChat', 'walletSupport', 'walletContributions']

/** Nothing waits in the moderator's own wallet: the face carries no number. */
export const noWalletNews = (): Record<string, Answer> => ({
  walletChat: { unreadConversations: 0 },
  walletSupport: { inProgress: 0 },
  walletContributions: 0,
})

/**
 * The answers every page needs once signed in: the moderator's own login, and the bar's question --
 * and their own choice of groups ("Meine Gruppen"), both columns: "Schöpfung" (MG1), which the start
 * page and the creation page ask with their counts, and "Support" (MG2b), which the support page
 * asks. Nothing chosen, as the server answers whoever has not chosen.
 */
export const signedInAnswers = (who = moderator): Record<string, Answer> => ({
  verifyLogin: who,
  ...noWalletNews(),
  handledCreationGroups: { groupIds: [], untagged: false },
  handledSupportGroups: { groupIds: [], untagged: false },
})

/**
 * Signs in the way the wallet hands over in development: the token in the address of
 * /authenticate, and the page to land on as `redirect`.
 */
export const signIn = async (page: Page, redirect: string, who = moderator) => {
  const search = new URLSearchParams({ token: tokenFor(who.gradidoID), redirect })
  await page.goto(`authenticate?${search}`)
}
