import { registerEnumType } from 'type-graphql'

export enum ApiVersionType {
  V1 = 'v1',
  V1_1 = 'v1_1',
  V2 = 'v2',
}

registerEnumType(ApiVersionType, {
  name: 'ApiVersionType',
  description: 'Endpoint prefix of the federation community url',
})
