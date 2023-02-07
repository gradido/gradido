import connection from '@/typeorm/connection'
import { getKlickTippUser } from '@/apis/KlicktippController'
import { User } from '@entity/User'
import LogError from '@/server/LogError'

export async function retrieveNotRegisteredEmails(): Promise<string[]> {
  const con = await connection()
  if (!con) {
    throw new LogError('No connection to database')
  }
  const users = await User.find({ relations: ['emailContact'] })
  const notRegisteredUser = []
  for (let i = 0; i < users.length; i++) {
    const user = users[i]
    try {
      await getKlickTippUser(user.emailContact.email)
    } catch (err) {
      notRegisteredUser.push(user.emailContact.email)
      // eslint-disable-next-line no-console
      console.log(`${user.emailContact.email}`)
    }
  }
  await con.close()
  // eslint-disable-next-line no-console
  console.log('User die nicht bei KlickTipp vorhanden sind: ', notRegisteredUser)
  return notRegisteredUser
}

retrieveNotRegisteredEmails()
