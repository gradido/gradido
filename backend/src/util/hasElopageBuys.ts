import { getCustomRepository } from '@dbTools/typeorm'
import { LoginElopageBuysRepository } from '../typeorm/repository/LoginElopageBuys'

export async function hasElopageBuys(email: string): Promise<boolean> {
  const loginElopageBuysRepository = getCustomRepository(LoginElopageBuysRepository)
  const elopageBuyCount = await loginElopageBuysRepository.count({ payerEmail: email })
  return elopageBuyCount > 0
}
