import { MiddlewareFn } from 'type-graphql'
import { signin, getKlickTippUser } from '../apis/KlicktippController'
import { KlickTipp } from '../graphql/models/KlickTipp'
import decode from '../jwt/decode'

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

export const klicktippNewsletterStateMiddleware: MiddlewareFn = async (
  { root, args, context, info },
  next,
) => {
  const result = await next()
  const klickTippUser = await getKlickTippUser(result.email)
  console.log('klickTippUser', klickTippUser)
  const klickTipp = new KlickTipp(klickTippUser)
  console.log('klickTipp', klickTipp)
  result.klickTipp = klickTipp
  console.log('result', result)
  return result
}
