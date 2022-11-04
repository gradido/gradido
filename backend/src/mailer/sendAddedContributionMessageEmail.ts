import { backendLogger as logger } from '@/server/logger'
import { sendEMail } from './sendEMail'
import { contributionMessageReceived } from './text/contributionMessageReceived'

export const sendAddedContributionMessageEmail = (data: {
  senderFirstName: string
  senderLastName: string
  recipientFirstName: string
  recipientLastName: string
  recipientEmail: string
  senderEmail: string
  contributionMemo: string
  message: string
  overviewURL: string
}): Promise<boolean> => {
  logger.info(
    `sendEmail(): to=${data.recipientFirstName} ${data.recipientLastName} <${data.recipientEmail}>,
      subject=${contributionMessageReceived.de.subject},
      text=${contributionMessageReceived.de.text(data)}`,
  )
  return sendEMail({
    to: `${data.recipientFirstName} ${data.recipientLastName} <${data.recipientEmail}>`,
    subject: contributionMessageReceived.de.subject,
    text: contributionMessageReceived.de.text(data),
  })
}
