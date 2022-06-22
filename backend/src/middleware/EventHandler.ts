import { MiddlewareFn } from 'type-graphql'
import { EventProtocol } from '@entity/EventProtocol'

export const EventHandler: MiddlewareFn = async (
  /* eslint-disable-next-line @typescript-eslint/no-unused-vars */
  { root, args, context, info },
  next,
) => {
  const event = new EventProtocol()
  // set values before calling the resolver here
  const result = await next()
  // set event values here when having the result ...
  await event.save()
  return result
}
