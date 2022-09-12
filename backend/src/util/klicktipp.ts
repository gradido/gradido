import connection from '@/typeorm/connection'
import { getKlickTippUser } from '@/apis/KlicktippController'
import { User } from '@entity/User'

export async function retrieveNotRegisteredEmails(): Promise<string[]> {
  const con = await connection()
  if (!con) {
    throw new Error('No connection to database')
  }
  const users = await User.find()
  const notRegisteredUser = []
  for (let i = 0; i < users.length; i++) {
    const user = users[i]
    try {
      await getKlickTippUser(user.email)
    } catch (err) {
      notRegisteredUser.push(user.email)
      // eslint-disable-next-line no-console
      console.log(`${user.email}`)
    }
  }
  await con.close()
  // eslint-disable-next-line no-console
  console.log('User die nicht bei KlickTipp vorhanden sind: ', notRegisteredUser)
  return notRegisteredUser
}

retrieveNotRegisteredEmails()
