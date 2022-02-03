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
  user.username = context.username ? context.username : faker.internet.userName()
  user.disabled = context.disabled ? context.disabled : false
  user.loginUserId = context.loginUserId ? context.loginUserId : randomInt(999999)
  user.indexId = 0
  user.description = context.description ? context.description : faker.random.words(4)
  // TODO Create real password and keys/hash
  user.password = context.password ? context.password : BigInt(0)
  user.privKey = context.privKey ? context.privKey : randomBytes(80)
  user.emailHash = context.emailHash ? context.emailHash : randomBytes(32)
  user.createdAt = context.createdAt ? context.createdAt : faker.date.recent()
  user.emailChecked = context.emailChecked === undefined ? false : context.emailChecked
  user.passphraseShown = context.passphraseShown ? context.passphraseShown : false
  user.language = context.language ? context.language : 'en'
  user.publisherId = context.publisherId ? context.publisherId : 0
  user.passphrase = context.passphrase ? context.passphrase : faker.random.words(24)

  return user
})
