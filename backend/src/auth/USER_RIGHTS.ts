import { RIGHTS } from './RIGHTS'

export const USER_RIGHTS = [
  RIGHTS.CHECK_USERNAME,
  RIGHTS.VERIFY_LOGIN,
  RIGHTS.BALANCE,
  RIGHTS.LIST_GDT_ENTRIES,
  RIGHTS.EXIST_PID,
  RIGHTS.UNSUBSCRIBE_NEWSLETTER,
  RIGHTS.SUBSCRIBE_NEWSLETTER,
  RIGHTS.TRANSACTION_LIST,
  RIGHTS.SEND_COINS,
  RIGHTS.LOGOUT,
  RIGHTS.UPDATE_USER_INFOS,
  RIGHTS.HAS_ELOPAGE,
  RIGHTS.CREATE_TRANSACTION_LINK,
  RIGHTS.DELETE_TRANSACTION_LINK,
  RIGHTS.REDEEM_TRANSACTION_LINK,
  RIGHTS.DISBURSE_TRANSACTION_LINK,
  RIGHTS.LIST_TRANSACTION_LINKS,
  RIGHTS.GDT_BALANCE,
  RIGHTS.CREATE_CONTRIBUTION,
  RIGHTS.DELETE_CONTRIBUTION,
  RIGHTS.LIST_CONTRIBUTIONS,
  RIGHTS.LIST_ALL_CONTRIBUTIONS,
  RIGHTS.UPDATE_CONTRIBUTION,
  RIGHTS.SEARCH_ADMIN_USERS,
  RIGHTS.LIST_CONTRIBUTION_LINKS,
  RIGHTS.COMMUNITY_STATISTICS,
  RIGHTS.CREATE_CONTRIBUTION_MESSAGE,
  RIGHTS.LIST_ALL_CONTRIBUTION_MESSAGES,
  RIGHTS.OPEN_CREATIONS,
  RIGHTS.USER,
  RIGHTS.GMS_USER_PLAYGROUND,
  // Every member gets these four with the resolver. What they reach is their own
  // entries and nothing else: each call filters on the caller's user id.
  RIGHTS.CREATE_MATCHING_ENTRY,
  RIGHTS.UPDATE_MATCHING_ENTRY,
  RIGHTS.DELETE_MATCHING_ENTRY,
  RIGHTS.LIST_MATCHING_ENTRY,
  // Which map and which place search the wallet uses (K-008). Read-only and not a secret,
  // so it is not in RESTRICTED_WHILE_UNCONFIRMED either.
  RIGHTS.MATCHING_MAP_SWITCHES,
  RIGHTS.HUMHUB_AUTO_LOGIN,
  RIGHTS.PROJECT_BRANDING_VIEW,
  RIGHTS.LIST_HUMHUB_SPACES,
  // The member's OWN address (the wallet reads it through verifyLogin). Somebody else's
  // is VIEW_USER_CONTACT, which is moderation only: it stood here until 11.09.2026 and let
  // every member read the address of anybody they could reach through a User - a
  // counterparty, a contact, the creator of a link.
  RIGHTS.VIEW_OWN_USER_CONTACT,
  RIGHTS.LIST_CREATION_GROUPS,
  RIGHTS.MANAGE_OWN_CREATION_GROUPS,
  // One right for the whole of "paying with a printed card", because every call it
  // guards reaches the caller's own settings and the caller's own cards, nothing else.
  // ⚠️ Taking a payment is NOT behind this right: there the RECIPIENT is the one who is
  // logged in, and the card is authorised by its code plus its PIN.
  RIGHTS.MANAGE_OWN_THANK_YOU_CARD,
  // Taking a card payment is a separate right from managing one's own card, because it
  // is the other side of the counter: here the caller is the RECIPIENT, and what
  // authorises the payment is the card's code plus its PIN, not this right. Separate so
  // that it can be taken away on its own.
  RIGHTS.RECEIVE_THANK_YOU_CARD_PAYMENT,
  // Asking for a new address, cancelling that request and seeing whether one is pending -
  // one right, because every call reaches the caller's own contact rows and nothing else.
  RIGHTS.MANAGE_OWN_EMAIL,
  // The contact list is a view on the caller's own bookings, the hearts are the caller's
  // own rows; there is nothing here that reaches anybody else's data.
  RIGHTS.MANAGE_OWN_CONTACTS,
  // The first creation: status, submit and skip all act on the caller's own process. Also
  // on RESTRICTED_WHILE_UNCONFIRMED: inside the 24-hour window (EM-013) it is open, after
  // it the whole window closes with the other value-creating rights.
  RIGHTS.FIRST_CREATION,
  // ES-021: both reach the caller's own account and nothing else. Neither is on
  // RESTRICTED_FOR_PROJECT_ACCOUNT — the way back (a request to the support) has to stay
  // open to the very account that is locked out of creating.
  RIGHTS.DECLARE_PROJECT_ACCOUNT,
  RIGHTS.REQUEST_CREATION_RIGHT,
]
