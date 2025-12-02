import { registerEnumType } from 'type-graphql'
import { RoleNames } from 'database'

export { RoleNames }

registerEnumType(RoleNames, {
  name: 'RoleNames', // this one is mandatory
  description: 'Possible role names', // this one is optional
})
