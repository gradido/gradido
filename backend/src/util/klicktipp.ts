// eslint-disable @typescript-eslint/no-explicit-any
import { User } from '@entity/User'

import { getKlickTippUser, addFieldsToSubscriber } from '@/apis/KlicktippController'
import { EventType } from '@/event/EventType'
import { lastDateTimeEvents } from '@/graphql/resolver/util/eventList'
import { LogError } from '@/server/LogError'
import { getConnection } from '@/typeorm/connection'

export async function retrieveNotRegisteredEmails(): Promise<string[]> {
  const con = await getConnection()
  if (!con) {
    throw new LogError('No connection to database')
  }
  const users = await User.find({ relations: ['emailContact'] })
  const notRegisteredUser = []
  for (const user of users) {
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
    const time = event.value.setSeconds(0)
    await addFieldsToSubscriber(event.email, { [value]: Math.trunc(time / 1000) })
  }
}

export async function exportEventDataToKlickTipp(): Promise<void> {
  const connectionInstance = await getConnection()
  if (!connectionInstance) {
    throw new LogError('No connection to database')
  }

  const lastLoginEvents = await lastDateTimeEvents(EventType.USER_LOGIN)
  void klickTippSendFieldToUser(lastLoginEvents, 'field186060')

  const registeredEvents = await lastDateTimeEvents(EventType.USER_ACTIVATE_ACCOUNT)
  void klickTippSendFieldToUser(registeredEvents, 'field186061')

  const receiveTransactionEvents = await lastDateTimeEvents(EventType.TRANSACTION_RECEIVE)
  void klickTippSendFieldToUser(receiveTransactionEvents, 'field185674')

  const contributionCreateEvents = await lastDateTimeEvents(EventType.TRANSACTION_SEND)
  void klickTippSendFieldToUser(contributionCreateEvents, 'field185673')

  const linkRedeemedEvents = await lastDateTimeEvents(EventType.TRANSACTION_LINK_REDEEM)
  void klickTippSendFieldToUser(linkRedeemedEvents, 'field185676')

  const confirmContributionEvents = await lastDateTimeEvents(EventType.ADMIN_CONTRIBUTION_CONFIRM)
  void klickTippSendFieldToUser(confirmContributionEvents, 'field185675')
}
void exportEventDataToKlickTipp()
// void retrieveNotRegisteredEmails()
