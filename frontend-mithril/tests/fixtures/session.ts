// AI-GENERATED — not an architecture reference
import type { Page } from '@playwright/test'
import { BIBI, member, tokenOf } from '../../test/member'
import type { Failure, test } from './graphql'

type Graphql = Parameters<Parameters<typeof test>[2]>[0]['graphql']

/** Bibi as `login` answers: with the fields only the old wallet still asks for. */
export const bibi = (more = {}) => ({
  ...member(BIBI),
  hasElopage: false,
  publisherId: null,
  // never null from the server: the old wallet reads into it
  klickTipp: { newsletterState: false },
  // asked for by the old wallet's verifyLogin
  aboutMe: null,
  ...more,
})

// ten minutes long; `iat` not 0, which the old wallet reads as none
export const BIBI_TOKEN = tokenOf(BIBI, { iat: 1, exp: 601 })

/** Fills the sign-in form in and sends it; the server takes it and answers with `who`. */
export async function signIn(
  page: Page,
  graphql: Graphql,
  who: ReturnType<typeof bibi> | Failure = bibi(),
) {
  graphql.answer({ login: who })
  graphql.renewToken(BIBI_TOKEN)
  await page.locator('#email-input-field').fill('bibi@bloxberg.de')
  await page.locator('#password-input-field').fill('Aa12345_')
  await page.locator('form button[type="submit"]').click()
}

/**
 * Does `how` and waits for the page for members it leads to: waited for after `how`, so that
 * the address shown before it does not count. The old wallet's shell asks at once (the
 * balance, the chat's beat, …) and is told that nothing of it is mocked. None of that is what a
 * spec of the sign-in is about, so what was asked from the landing on is let go; what was
 * asked on the way there is kept for the fixture to report.
 */
export async function landAt(
  page: Page,
  graphql: Graphql,
  address: RegExp,
  how: () => Promise<unknown>,
) {
  await how()
  await page.waitForURL(address)
  const { length: unanswered } = graphql.unanswered
  const { length: objections } = graphql.objections
  await page.waitForLoadState('networkidle')
  graphql.unanswered.length = unanswered
  graphql.objections.length = objections
}

/** Signs in and waits for the page the sign-in leads to. */
export const signInAndLandAt = (page: Page, graphql: Graphql, address: RegExp, who = bibi()) =>
  landAt(page, graphql, address, () => signIn(page, graphql, who))
