import { User } from 'database'

import { addFieldsToSubscriber, getKlickTippUser } from '@/apis/KlicktippController'
import { EventType } from '@/event/EventType'
import { lastDateTimeEvents } from '@/graphql/resolver/util/eventList'

export async function retrieveNotRegisteredEmails(): Promise<string[]> {
  const users = await User.find({ relations: ['emailContact'] })
  const notRegisteredUser: string[] = []
  for (const user of users) {
    try {
      await getKlickTippUser(user.emailContact.email)
    } catch (_err) {
      notRegisteredUser.push(user.emailContact.email)
    }
  }
  return notRegisteredUser
}

async function klickTippSendFieldToUser(
  events: { email: string; value: Date }[],
  field: string,
): Promise<void> {
  for (const event of events) {
    const time = event.value.setSeconds(0)
    await addFieldsToSubscriber(event.email, { [field]: Math.trunc(time / 1000) })
  }
}

export async function exportEventDataToKlickTipp(): Promise<boolean> {
  const lastLoginEvents = await lastDateTimeEvents(EventType.USER_LOGIN)
  await klickTippSendFieldToUser(lastLoginEvents, 'field186060')

  const registeredEvents = await lastDateTimeEvents(EventType.USER_ACTIVATE_ACCOUNT)
  await klickTippSendFieldToUser(registeredEvents, 'field186061')

  const receiveTransactionEvents = await lastDateTimeEvents(EventType.TRANSACTION_RECEIVE)
  await klickTippSendFieldToUser(receiveTransactionEvents, 'field185674')

  const contributionCreateEvents = await lastDateTimeEvents(EventType.TRANSACTION_SEND)
  await klickTippSendFieldToUser(contributionCreateEvents, 'field185673')

  const linkRedeemedEvents = await lastDateTimeEvents(EventType.TRANSACTION_LINK_REDEEM)
  await klickTippSendFieldToUser(linkRedeemedEvents, 'field185676')

  const confirmContributionEvents = await lastDateTimeEvents(EventType.ADMIN_CONTRIBUTION_CONFIRM)
  await klickTippSendFieldToUser(confirmContributionEvents, 'field185675')

  return true
}
