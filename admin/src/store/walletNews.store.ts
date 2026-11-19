// AI-GENERATED — not an architecture reference

import m from 'mithril'
import * as v from 'valibot'
import { NO_WALLET_NEWS, type WalletNews, walletNewsOf } from '@/data/WalletNews.logic'
import { walletNewsSchema } from '@/data/WalletNews.schema'
import { graphqlRequest, REVOKED } from '@/graphql/client'
import { moderatorWalletNews } from '@/graphql/moderatorWalletNews.graphql'
import { adminStore } from './admin.store'

/**
 * What waits in the moderator's own wallet, for the number at their face in the bar (Bernd,
 * 16.11.2026): asked every fifteen seconds while the admin is in sight, at once when it comes back
 * into sight -- the beat of the wallet's chat. A page change asks nothing of its own: on a page the
 * moderator works through (open, read, confirm) the address does not change for a long time.
 *
 * ⛔ The questions are the admin's, not the moderator's (`background`): they keep the session's
 * clock where the moderator left it, so ten minutes without a click of their own still end it.
 * Then the answer is the ended session, and the beat stops -- the number keeps its last state, and
 * the moderator's next click finds the session's end, as before. A sign-out in another window of
 * the origin signs this admin out without leaving the page (authToken.ts): with the token gone the
 * number goes at once, and the beat stops before it would ask without one.
 *
 * One state for the admin, here in the module and not in adminStore: that one is kept in
 * localStorage, and these numbers are the moderator's of this moment.
 */
export const WALLET_NEWS_INTERVAL_MS = 15000

let news: WalletNews = NO_WALLET_NEWS
let running = false
let timer: ReturnType<typeof setTimeout> | undefined
// which start a question belongs to: an answer that lands after a stop is dropped
let generation = 0
// the start whose question is on its way, if any: never two of one start at once
let asking: number | null = null

// what the server answers where the session is over: ended or revoked, and without a token or
// for an account that is gone
const SESSION_OVER = [REVOKED, '401 Unauthorized']

/** The wallet's three marks together, while somebody is signed in; 0 before the first answer. */
export const walletNewsCount = () =>
  adminStore.token ? news.chat + news.support + news.contributions : 0

const inSight = () => !document.hidden

const schedule = () => {
  clearTimeout(timer)
  timer = running && inSight() ? setTimeout(ask, WALLET_NEWS_INTERVAL_MS) : undefined
}

const ask = async () => {
  clearTimeout(timer)
  if (!running || asking === generation || !inSight()) {
    return
  }
  if (!adminStore.token) {
    running = false
    return
  }
  const mine = generation
  asking = mine
  const answer = await graphqlRequest(moderatorWalletNews, {}, { background: true })
  if (asking === mine) {
    asking = null
  }
  if (mine !== generation) {
    return
  }
  if (!answer.success) {
    if (answer.error.messages.some((message) => SESSION_OVER.includes(message))) {
      running = false
      return
    }
    schedule()
    return
  }
  const before = walletNewsCount()
  news = walletNewsOf(news, v.parse(walletNewsSchema, answer.value))
  if (walletNewsCount() !== before) {
    m.redraw()
  }
  schedule()
}

const onVisibility = () => {
  if (inSight()) {
    ask()
  } else {
    clearTimeout(timer)
  }
}

/** Starts the beat for the moderator signed in (NavBar); a second start while it runs changes nothing. */
export const startWalletNews = () => {
  if (running) {
    return
  }
  running = true
  document.addEventListener('visibilitychange', onVisibility)
  ask()
}

/** Stops it and forgets the number: the bar is gone, and with it the moderator it was for. */
export const stopWalletNews = () => {
  running = false
  generation += 1
  clearTimeout(timer)
  document.removeEventListener('visibilitychange', onVisibility)
  news = NO_WALLET_NEWS
}
