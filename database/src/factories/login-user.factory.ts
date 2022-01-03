import Faker from 'faker'
import { define } from 'typeorm-seeding'
import { LoginUser } from '../../entity/LoginUser'
import { randomBytes } from 'crypto'
import { LoginUserContext } from '../interface/UserContext'

define(LoginUser, (faker: typeof Faker, context?: LoginUserContext) => {
  if (!context) context = {}

  const user = new LoginUser()
  user.email = context.email ? context.email : faker.internet.email()
  user.firstName = context.firstName ? context.firstName : faker.name.firstName()
  user.lastName = context.lastName ? context.lastName : faker.name.lastName()
  user.username = context.username ? context.username : faker.internet.userName()
  user.description = context.description ? context.description : faker.random.words(4)
  // TODO Create real password and keys/hash
  user.password = context.password ? context.password : BigInt(0)
  user.pubKey = context.pubKey ? context.pubKey : randomBytes(32)
  user.privKey = context.privKey ? context.privKey : randomBytes(80)
  user.emailHash = context.emailHash ? context.emailHash : randomBytes(32)
  user.createdAt = context.createdAt ? context.createdAt : faker.date.recent()
  user.emailChecked = context.emailChecked ? context.emailChecked : true
  user.passphraseShown = context.passphraseShown ? context.passphraseShown : false
  user.language = context.language ? context.language : 'en'
  user.disabled = context.disabled ? context.disabled : false
  user.groupId = context.groupId ? context.groupId : 1
  user.publisherId = context.publisherId ? context.publisherId : 0

  return user
})
