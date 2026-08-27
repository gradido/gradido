// AI-GENERATED — not an architecture reference
import { In } from 'typeorm'
import { LoginElopageBuys as DbLoginElopageBuys } from '../entity'

/**
 * How many Elopage events the webhook filed under any of these payer addresses. Only the
 * payer column names the member - the publisher column names the seller - so only that
 * one is looked at, as it always has been.
 */
export async function dbCountElopageBuysByEmails(payerEmails: string[]): Promise<number> {
  if (payerEmails.length === 0) {
    return 0
  }
  return DbLoginElopageBuys.count({ where: { payerEmail: In(payerEmails) } })
}

/** How many Elopage events the webhook filed under this payer address. */
export async function dbCountElopageBuysByEmail(payerEmail: string): Promise<number> {
  return dbCountElopageBuysByEmails([payerEmail])
}
