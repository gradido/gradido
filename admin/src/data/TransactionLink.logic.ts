// AI-GENERATED — not an architecture reference
import { d, t } from '@/i18n'
import type { MemberTransactionLink } from './MemberTabs.schema'

/** What became of a link: deleted, redeemed, expired -- each with its day --, or still open. */
export const linkState = (link: MemberTransactionLink, now = new Date()) => {
  if (link.deletedAt) {
    return `${t('deleted')}: ${d(new Date(link.deletedAt))}`
  }
  if (link.redeemedAt) {
    return `${t('redeemed')}: ${d(new Date(link.redeemedAt))}`
  }
  if (now > new Date(link.validUntil)) {
    return `${t('expired')}: ${d(new Date(link.validUntil))}`
  }
  return t('open')
}
