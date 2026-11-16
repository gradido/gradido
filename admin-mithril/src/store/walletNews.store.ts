// AI-GENERATED — not an architecture reference
import { moderatorWalletNews } from '@admin/graphql/moderatorWalletNews.graphql'
import m from 'mithril'
import * as v from 'valibot'
import { NO_WALLET_NEWS, type WalletNews, walletNewsOf } from '@/data/WalletNews.logic'
import { walletNewsSchema } from '@/data/WalletNews.schema'
import { graphqlRequest, REVOKED } from '@/graphql/client'

/**
 * What waits in the moderator's own wallet, for the number at their face in the bar (Bernd,
 * 16.11.2026): asked every fifteen seconds while the admin is in sight, at once when it comes back
 * into sight -- the beat of the wallet's chat. A page change asks nothing of its own: on a page the
 * moderator works through (open, read, confirm) the address does not change for a long time.
 *
 * ⛔ The questions are the admin's, not the moderator's (`background`): they keep the session's
 * clock where the moderator left it, so ten minutes without a click of their own still end it.
 * Then the answer is the ended session, and the beat stops -- the number keeps its last state, and
 * the moderator's next click finds the session's end, as before.
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
// the start whose question is on its way, if any: never two at once
let asking: number | null = null

/** The wallet's three marks together; 0 before the first answer and after a stop. */
export const walletNewsCount = () => news.chat + news.support + news.contributions

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
    if (answer.error.messages.includes(REVOKED)) {
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
