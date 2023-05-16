import { Raw } from '@dbTools/typeorm'
import { User as DbUser } from '@entity/User'

import { LogError } from '@/server/LogError'

// eslint-disable-next-line security/detect-unsafe-regex
export const validAliasRegex = /^(?=.{3,20}$)[a-zA-Z0-9]+(?:[_-][a-zA-Z0-9]+?)*$/

const reservedAlias = [
  'admin',
  'email',
  'gast',
  'gdd',
  'gradido',
  'guest',
  'home',
  'root',
  'support',
  'temp',
  'tmp',
  'tmp',
  'user',
  'usr',
  'var',
]

export const validateAlias = async (alias: string): Promise<boolean> => {
  if (alias.length < 3) throw new LogError('Given alias is too short', alias)
  if (alias.length > 20) throw new LogError('Given alias is too long', alias)
  if (!alias.match(validAliasRegex)) throw new LogError('Invalid characters in alias', alias)
  if (reservedAlias.includes(alias.toLowerCase())) throw new LogError('Alias is not allowed', alias)
  const aliasInUse = await DbUser.find({
    where: { alias: Raw((a) => `LOWER(${a}) = "${alias.toLowerCase()}"`) },
  })
  if (aliasInUse.length !== 0) {
    throw new LogError('Alias already in use', alias)
  }
  return true
}
