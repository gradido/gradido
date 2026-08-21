// AI-GENERATED — not an architecture reference
import { LoginElopageBuys as DbLoginElopageBuys } from '../entity'

/** How many Elopage events the webhook filed under this payer address. */
export async function dbCountElopageBuysByEmail(payerEmail: string): Promise<number> {
  return DbLoginElopageBuys.count({ where: { payerEmail } })
}
