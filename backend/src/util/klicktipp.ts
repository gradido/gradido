 // eslint-disable @typescript-eslint/no-explicit-any
import { User } from '@entity/User'

import { getKlickTippUser, addFieldsToSubscriber } from '@/apis/KlicktippController'
import LogError from '@/server/LogError'
import connection from '@/typeorm/connection'
import { lastDateTimeEvents } from '@/graphql/resolver/util/eventList'
import { EventType } from '@/event/EventType'
import { Event as DbEvent } from '@/event/Event'

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

function klickTippSendFieldToUser(events: any, value: string): void {
  for(const event of events) {
    addFieldsToSubscriber(event.email, { [value]: event.value })
  }
}

export async function exportEventDataToKlickTipp(): Promise<void> {
  const connectionInstance = await connection()
  if (!connectionInstance) {
    throw new LogError('No connection to database')
  }

  const lastLoginEvents = await lastDateTimeEvents(EventType.USER_LOGIN)
  klickTippSendFieldToUser(lastLoginEvents, 'GDD last login')

  const registeredEvents = await lastDateTimeEvents(EventType.USER_ACTIVATE_ACCOUNT)
  klickTippSendFieldToUser(registeredEvents, 'GDD date of registration')

  const receiveTransactionEvents = await lastDateTimeEvents(EventType.TRANSACTION_RECEIVE)
  klickTippSendFieldToUser(receiveTransactionEvents, 'GDD last received')
  
  const contributionCreateEvents = await lastDateTimeEvents(EventType.TRANSACTION_SEND)
  klickTippSendFieldToUser(contributionCreateEvents, 'GDD last sent')
  
  const linkRedeemedEvents = await lastDateTimeEvents(EventType.TRANSACTION_LINK_REDEEM)
  klickTippSendFieldToUser(linkRedeemedEvents, 'GDD last invited')
  
  const confirmContributionEvents = await lastDateTimeEvents(EventType.ADMIN_CONTRIBUTION_CONFIRM)
  klickTippSendFieldToUser(confirmContributionEvents, 'GDD last created')
}
void exportEventDataToKlickTipp()
// void retrieveNotRegisteredEmails()
