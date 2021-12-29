import { MiddlewareFn } from 'type-graphql'
import { /* signIn, */ getKlickTippUser } from '../apis/KlicktippController'
import { KlickTipp } from '../graphql/model/KlickTipp'
import CONFIG from '../config/index'

// export const klicktippRegistrationMiddleware: MiddlewareFn = async (
//   // Only for demo
//   /* eslint-disable-next-line @typescript-eslint/no-unused-vars */
//   { root, args, context, info },
//   next,
// ) => {
//   // Do Something here before resolver is called
//   const result = await next()
//   // Do Something here after resolver is completed
//   await signIn(result.email, result.language, result.firstName, result.lastName)
//   return result
// }

export const klicktippNewsletterStateMiddleware: MiddlewareFn = async (
  /* eslint-disable-next-line @typescript-eslint/no-unused-vars */
  { root, args, context, info },
  next,
) => {
  const result = await next()
  let klickTipp = new KlickTipp({ status: 'Unsubscribed' })
  if (CONFIG.KLICKTIPP) {
    try {
      const klickTippUser = await getKlickTippUser(result.email)
      if (klickTippUser) {
        klickTipp = new KlickTipp(klickTippUser)
      }
    } catch (err) {}
  }
  result.klickTipp = klickTipp
  return result
}
