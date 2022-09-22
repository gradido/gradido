import { backendLogger as logger } from '@/server/logger'
import Decimal from 'decimal.js-light'
import { sendEMail } from './sendEMail'
import { transactionLinkRedeemed } from './text/transactionLinkRedeemed'

export const sendTransactionLinkRedeemedEmail = (data: {
  email: string
  senderFirstName: string
  senderLastName: string
  recipientFirstName: string
  recipientLastName: string
  senderEmail: string
  amount: Decimal
  memo: string
  overviewURL: string
}): Promise<boolean> => {
  logger.info(
    `sendEmail(): to=${data.recipientFirstName} ${data.recipientLastName},
        <${data.email}>,
        subject=${transactionLinkRedeemed.de.subject},
        text=${transactionLinkRedeemed.de.text(data)}`,
  )
  return sendEMail({
    to: `${data.recipientFirstName} ${data.recipientLastName} <${data.email}>`,
    subject: transactionLinkRedeemed.de.subject,
    text: transactionLinkRedeemed.de.text(data),
  })
}
