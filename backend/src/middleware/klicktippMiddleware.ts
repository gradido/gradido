import { MiddlewareFn } from 'type-graphql'
import { signin } from '../apis/KlicktippController'

export const klicktippRegistrationMiddleware: MiddlewareFn = async (
  // Only for demo
  /* eslint-disable-next-line @typescript-eslint/no-unused-vars */
  { root, args, context, info },
  next,
) => {
  // Do Something here before resolver is called
  const result = await next()
  // Do Something here after resolver is completed
  signin(result.email, result.language, result.firstName, result.lastName)
  return result
}
