// AI-GENERATED — not an architecture reference
import { dbSelectUserRemarkWithMemberNames } from 'database'
import { withoutMemberNames } from '@/apis/anthropic/crea/memberRemark'
import { RIGHTS } from '@/auth/RIGHTS'
import { Context } from '@/server/context'
import { countRemark } from './countRemark'

/**
 * The moderation's remark on the member, as Crea is given it (Bernd, 28.10.2026): without the
 * member's own names (E-012). Read here, not sent by the admin interface, so the remark stays out
 * of the request log; counted like every read of one, so the answer, which may speak of it, stays
 * out as well (plugins.ts). Counted before the read: a document asking too often reads nothing.
 *
 * Only where the admin interface names the member, which it does only when the moderator lets Crea
 * read the remark ("Crea liest mit", off at each opening of the window); and only for a caller who
 * may read it: today every holder of AI_SEND_MESSAGE is a moderator, and this keeps it so should
 * the sets ever part. The stub preview reads none.
 */
export async function remarkForCrea(
  context: Context,
  userId?: number | null,
): Promise<string | null> {
  if (!userId || !context.role?.hasRight(RIGHTS.MANAGE_USER_REMARKS)) {
    return null
  }
  countRemark(context)
  const found = await dbSelectUserRemarkWithMemberNames(userId)
  return found ? withoutMemberNames(found.remark, found.memberNames) : null
}
