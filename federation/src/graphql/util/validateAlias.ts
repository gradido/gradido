import { User as DbUser } from 'database'
import { Raw } from 'typeorm'

import { LogError } from '@/server/LogError'

export const VALID_ALIAS_REGEX = /^(?=.{3,20}$)[a-zA-Z0-9]+(?:[_-][a-zA-Z0-9]+?)*$/

const RESERVED_ALIAS = [
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
  if (alias.length < 3) {
    throw new LogError('Given alias is too short', alias)
  }
  if (alias.length > 20) {
    throw new LogError('Given alias is too long', alias)
  }
  if (!alias.match(VALID_ALIAS_REGEX)) {
    throw new LogError('Invalid characters in alias', alias)
  }
  if (RESERVED_ALIAS.includes(alias.toLowerCase())) {
    throw new LogError('Alias is not allowed', alias)
  }
  const aliasInUse = await DbUser.find({
    where: { alias: Raw((a) => `LOWER(${a}) = "${alias.toLowerCase()}"`) },
  })
  if (aliasInUse.length !== 0) {
    throw new LogError('Alias already in use', alias)
  }
  return true
}
