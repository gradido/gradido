// AI-GENERATED — not an architecture reference
import { USER_REMARKS_MAX_PER_REQUEST } from '@/data/UserRemark.logic'
import { Context } from '@/server/context'
import { LogError } from '@/server/LogError'

/**
 * ⛔ Counts a read or a write of the moderation's remark in the HTTP request's budget: a document
 * may repeat a field under any number of aliases (RequestBudget). The count also keeps the answer
 * of a request that read a remark out of the log (plugins.ts) -- Crea's answer as well, which may
 * speak of it (CreaResolver).
 */
export const countRemark = (context: Context): void => {
  context.requestBudget.userRemarksServed += 1
  const served = context.requestBudget.userRemarksServed
  if (served > USER_REMARKS_MAX_PER_REQUEST) {
    throw new LogError('Too many remarks asked for at once', served)
  }
}
