import { RoleNames } from 'database'
import { registerEnumType } from 'type-graphql'

export { RoleNames }

registerEnumType(RoleNames, {
  name: 'RoleNames', // this one is mandatory
  description: 'Possible role names', // this one is optional
})
