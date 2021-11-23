import Faker from 'faker'
import { define } from 'typeorm-seeding'
import { ServerUser } from '../../entity/ServerUser'

interface ServerUserContext {
  username?: string
  password?: BigInt
  email?: string
  role?: string
  activated?: number
  lastLogin?: Date
  created?: Date
  modified?: Date
}

define(ServerUser, (faker: typeof Faker, context?: ServerUserContext) => {
  if (!context) context = {}

  const user = new ServerUser()
  user.username = context.username ? context.username : faker.internet.userName()
  user.password = context.password ? context.password : BigInt(0)
  user.email = context.email ? context.email : faker.internet.email()
  user.role = context.role ? context.role : 'admin'
  user.activated = context.activated ? context.activated : 0
  user.lastLogin = context.lastLogin ? context.lastLogin : faker.date.recent()
  user.created = context.created ? context.created : faker.date.recent()
  user.modified = context.modified ? context.modified : faker.date.recent()

  return user
})
