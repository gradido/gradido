// AI-GENERATED — not an architecture reference

import { VALID_ALIAS_REGEX } from 'shared'

/**
 * Whether the name stored on a booking may be shown as a member's ALIAS.
 *
 * `transactions.user_name` and `transactions.linked_user_name` are permanent, and their
 * meaning changed over time: since #3645 they hold the member's alias, before that they
 * held an assembled "Firstname Lastname". A row does not say which era it comes from.
 *
 * ⛔ Why that matters: `User.alias` is NOT behind the real-name guard (NU-019) -- it is
 * the field that replaced the guarded name everywhere. Passing a legacy value through it
 * would hand every reader the counterparty's real name, by the very mechanism built to
 * stop that.
 *
 * The SHAPE is the only discriminator available, and it is sufficient for the data that
 * exists: an alias is 3-20 characters of letters and digits with single `-`/`_`
 * separators, so it can never contain the space that every assembled name carries -- the
 * same space `TransactionResolver` still splits legacy rows on. Where this says no, the
 * caller falls back to the gradidoID, which is the safe direction.
 *
 * ⚠️ What it cannot do: a legacy value that is a single alias-shaped word is
 * indistinguishable from an alias, and is treated as one. Ending that needs an era marker
 * on the row rather than a guess about its content.
 *
 * Exempt from Result on purpose: every input produces an answer.
 */
export const isAliasEraName = (storedName: string | null | undefined): boolean =>
  typeof storedName === 'string' && VALID_ALIAS_REGEX.test(storedName)
