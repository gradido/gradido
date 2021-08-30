import { MiddlewareFn } from 'type-graphql'

/* eslint-disable-next-line @typescript-eslint/no-unused-vars */
export const registerMiddleware: MiddlewareFn = async ({ root, args, context, info }, next) => {
  const result = await next()
  // do something here
  return result
}
