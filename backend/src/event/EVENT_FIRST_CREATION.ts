// AI-GENERATED — not an architecture reference
import { Contribution as DbContribution, Event as DbEvent, User as DbUser } from 'database'

import { Event } from './Event'
import { EventType } from './EventType'

/**
 * The member closed the window without entering anything (ES-011). The only trace of a
 * skip: the state table describes the process, not the history of the window, and the
 * measurement sheet counts skippers from here.
 */
export const EVENT_FIRST_CREATION_SKIP = async (user: DbUser): Promise<DbEvent> =>
  Event(EventType.FIRST_CREATION_SKIP, user, user).save()

/**
 * The three outcomes of one first creation, all with the member as the affected user, the
 * signer as the acting user and the FIRST contribution of the bundle as the involved one -
 * the one that carries the message in its thread.
 */
export const EVENT_FIRST_CREATION_DONE = async (
  user: DbUser,
  signer: DbUser,
  firstContribution: DbContribution,
): Promise<DbEvent> =>
  Event(EventType.FIRST_CREATION_DONE, user, signer, null, null, firstContribution).save()

export const EVENT_FIRST_CREATION_REVIEW = async (
  user: DbUser,
  signer: DbUser,
  firstContribution: DbContribution,
): Promise<DbEvent> =>
  Event(EventType.FIRST_CREATION_REVIEW, user, signer, null, null, firstContribution).save()

export const EVENT_FIRST_CREATION_UNBOOKED = async (
  user: DbUser,
  signer: DbUser,
  firstContribution: DbContribution,
): Promise<DbEvent> =>
  Event(EventType.FIRST_CREATION_UNBOOKED, user, signer, null, null, firstContribution).save()
