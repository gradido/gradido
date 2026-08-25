// AI-GENERATED — not an architecture reference
import { RIGHTS } from './RIGHTS'

/**
 * What an account with an UNCONFIRMED address may no longer do once its grace period
 * has run out (EM-013). The principle: creating value and acting outward is refused —
 * viewing, taking back one's own things, and self-management stay. That keeps every
 * display path of the wallet working behind the reminder modal, and it keeps the two
 * ways OUT of the blockade open on purpose: resending the confirmation mail and
 * correcting a mistyped address both live behind MANAGE_OWN_EMAIL, which is therefore
 * NOT on this list.
 *
 * A deny-list rather than an allow-list, deliberately: the person locked out here is
 * the account's own legitimate holder being nudged to confirm — not an attacker. A
 * forgotten entry on this list leaves one action open a little longer; a forgotten
 * entry on an allow-list would break a harmless display behind the modal. The modal in
 * the wallet is the visible half of this; this list is what makes the blockade hold
 * against a bare API call.
 */
export const RESTRICTED_WHILE_UNCONFIRMED = [
  RIGHTS.SEND_COINS,
  RIGHTS.CREATE_TRANSACTION_LINK,
  RIGHTS.REDEEM_TRANSACTION_LINK,
  RIGHTS.DISBURSE_TRANSACTION_LINK,
  RIGHTS.CREATE_CONTRIBUTION,
  RIGHTS.UPDATE_CONTRIBUTION,
  RIGHTS.CREATE_CONTRIBUTION_MESSAGE,
  RIGHTS.CREATE_MATCHING_ENTRY,
  RIGHTS.UPDATE_MATCHING_ENTRY,
  RIGHTS.MANAGE_OWN_THANK_YOU_CARD,
  RIGHTS.RECEIVE_THANK_YOU_CARD_PAYMENT,
]
