// eslint-disable @typescript-eslint/no-explicit-any
import { User } from '@entity/User'

import { getKlickTippUser, addFieldsToSubscriber } from '@/apis/KlicktippController'
import { EventType } from '@/event/EventType'
import { lastDateTimeEvents } from '@/graphql/resolver/util/eventList'
import LogError from '@/server/LogError'
import connection from '@/typeorm/connection'

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

async function klickTippSendFieldToUser(
  events: { email: string; value: Date }[],
  value: string,
): Promise<void> {
  for (const event of events) {
    await addFieldsToSubscriber(event.email, { [value]: event.value })
  }
}

export async function exportEventDataToKlickTipp(): Promise<void> {
  const connectionInstance = await connection()
  if (!connectionInstance) {
    throw new LogError('No connection to database')
  }

  const lastLoginEvents = await lastDateTimeEvents(EventType.USER_LOGIN)
  void klickTippSendFieldToUser(lastLoginEvents, 'GDD last login')

  const registeredEvents = await lastDateTimeEvents(EventType.USER_ACTIVATE_ACCOUNT)
  void klickTippSendFieldToUser(registeredEvents, 'GDD date of registration')

  const receiveTransactionEvents = await lastDateTimeEvents(EventType.TRANSACTION_RECEIVE)
  void klickTippSendFieldToUser(receiveTransactionEvents, 'GDD last received')

  const contributionCreateEvents = await lastDateTimeEvents(EventType.TRANSACTION_SEND)
  void klickTippSendFieldToUser(contributionCreateEvents, 'GDD last sent')

  const linkRedeemedEvents = await lastDateTimeEvents(EventType.TRANSACTION_LINK_REDEEM)
  void klickTippSendFieldToUser(linkRedeemedEvents, 'GDD last invited')

  const confirmContributionEvents = await lastDateTimeEvents(EventType.ADMIN_CONTRIBUTION_CONFIRM)
  void klickTippSendFieldToUser(confirmContributionEvents, 'GDD last created')
}
void exportEventDataToKlickTipp()
// void retrieveNotRegisteredEmails()
