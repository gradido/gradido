import { Directive, registerEnumType } from 'type-graphql'

export enum CacheControlScope {
  PUBLIC = 'PUBLIC',
  PRIVATE = 'PRIVATE',
}

registerEnumType(CacheControlScope, {
  name: 'CacheControlScope',
  description: 'Possible Vaue for Scope of Cache',
})

@Directive(`
@cacheControl(
  maxAge: Int
  scope: CacheControlScope
  inheritMaxAge: Boolean  
) on FIELD_DEFINITION | OBJECT | INTERFACE | UNION`)
