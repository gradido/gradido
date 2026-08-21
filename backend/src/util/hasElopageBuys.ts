import { dbFindConfirmedUserContactEmails, LoginElopageBuys } from 'database'
import { In } from 'typeorm'

/**
 * Did this member ever buy something through Elopage? The webhook files purchases under the
 * address they were paid with, so every address the member has CONFIRMED is looked at -
 * a purchase made before the member changed their address still counts. A yes/no can be
 * asked over all of them without counting anything twice.
 */
export async function hasElopageBuys(userId: number): Promise<boolean> {
  const emails = await dbFindConfirmedUserContactEmails(userId)
  if (emails.length === 0) {
    return false
  }
  const elopageBuyCount = await LoginElopageBuys.count({ where: { payerEmail: In(emails) } })
  return elopageBuyCount > 0
}
