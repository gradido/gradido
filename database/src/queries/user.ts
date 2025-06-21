import { Raw } from 'typeorm'
import { User as DbUser } from '../entity'

export async function aliasExists(alias: string): Promise<boolean> {
  const user = await DbUser.findOne({
    where: { alias: Raw((a) => `LOWER(${a}) = LOWER(:alias)`, { alias }) },
  })
  return user !== null
}