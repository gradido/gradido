import { LoginElopageBuys } from 'database'

export async function hasElopageBuys(email: string): Promise<boolean> {
  const elopageBuyCount = await LoginElopageBuys.count({ where: { payerEmail: email } })
  return elopageBuyCount > 0
}
