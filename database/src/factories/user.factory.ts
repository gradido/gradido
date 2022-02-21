import Faker from 'faker'
import { define } from 'typeorm-seeding'
import { User } from '../../entity/User'
import { randomBytes, randomInt } from 'crypto'
import { UserContext } from '../interface/UserContext'

define(User, (faker: typeof Faker, context?: UserContext) => {
  if (!context) context = {}

  const user = new User()
  user.pubKey = context.pubKey ? context.pubKey : randomBytes(32)
  user.email = context.email ? context.email : faker.internet.email()
  user.firstName = context.firstName ? context.firstName : faker.name.firstName()
  user.lastName = context.lastName ? context.lastName : faker.name.lastName()
  user.deletedAt = context.deletedAt ? context.deletedAt : null
  // TODO Create real password and keys/hash
  user.password = context.password ? context.password : BigInt(0)
  user.privKey = context.privKey ? context.privKey : randomBytes(80)
  user.emailHash = context.emailHash ? context.emailHash : randomBytes(32)
  user.createdAt = context.createdAt ? context.createdAt : faker.date.recent()
  user.emailChecked = context.emailChecked === undefined ? false : context.emailChecked
  user.language = context.language ? context.language : 'en'
  user.publisherId = context.publisherId ? context.publisherId : 0
  user.passphrase = context.passphrase ? context.passphrase : faker.random.words(24)

  return user
})
