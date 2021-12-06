import Faker from 'faker'
import { define } from 'typeorm-seeding'
import { User } from '../../entity/User'
import { randomBytes } from 'crypto'
import { UserContext } from '../interface/UserContext'

define(User, (faker: typeof Faker, context?: UserContext) => {
  if (!context) context = {}

  const user = new User()
  user.pubkey = context.pubkey ? context.pubkey : randomBytes(32)
  user.email = context.email ? context.email : faker.internet.email()
  user.firstName = context.firstName ? context.firstName : faker.name.firstName()
  user.lastName = context.lastName ? context.lastName : faker.name.lastName()
  user.username = context.username ? context.username : faker.internet.userName()
  user.disabled = context.disabled ? context.disabled : false
  user.groupId = 0
  user.indexId = 0

  return user
})
