import { LoginElopageBuys } from '@entity/LoginElopageBuys'

export async function hasElopageBuys(email: string): Promise<boolean> {
  const elopageBuyCount = await LoginElopageBuys.count({ payerEmail: email })
  return elopageBuyCount > 0
}
