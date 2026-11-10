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
}

const base64Url = (value: object) => Buffer.from(JSON.stringify(value)).toString('base64url')

/** A token the admin reads its subject from; the signature is never checked in the browser. */
export const tokenFor = (gradidoID: string) =>
  `${base64Url({ alg: 'HS256', typ: 'JWT' })}.${base64Url({ sub: gradidoID })}.signature`

/** The answers every page needs once signed in: the moderator's own login. */
export const signedInAnswers = (who = moderator): Record<string, Answer> => ({
  verifyLogin: who,
})

/**
 * Signs in the way the wallet hands over in development: the token in the address of
 * /authenticate, and the page to land on as `redirect`.
 */
export const signIn = async (page: Page, redirect: string, who = moderator) => {
  const search = new URLSearchParams({ token: tokenFor(who.gradidoID), redirect })
  await page.goto(`authenticate?${search}`)
}
