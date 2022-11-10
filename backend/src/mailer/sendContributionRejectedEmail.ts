import { backendLogger as logger } from '@/server/logger'
import Decimal from 'decimal.js-light'
import { sendEMail } from './sendEMail'
import { contributionRejected } from './text/contributionRejected'

export const sendContributionRejectedEmail = (data: {
  senderFirstName: string
  senderLastName: string
  recipientFirstName: string
  recipientLastName: string
  recipientEmail: string
  contributionMemo: string
  contributionAmount: Decimal
  overviewURL: string
}): Promise<boolean> => {
  logger.info(
    `sendEmail(): to=${data.recipientFirstName} ${data.recipientLastName} <${data.recipientEmail}>,
    subject=${contributionRejected.de.subject},
    text=${contributionRejected.de.text(data)}`,
  )
  return sendEMail({
    to: `${data.recipientFirstName} ${data.recipientLastName} <${data.recipientEmail}>`,
    subject: contributionRejected.de.subject,
    text: contributionRejected.de.text(data),
  })
}
