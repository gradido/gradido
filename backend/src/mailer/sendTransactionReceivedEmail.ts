import Decimal from 'decimal.js-light'
import { sendEMail } from './sendEMail'
import { transactionReceived } from './text/transactionReceived'

export const sendTransactionReceivedEmail = (data: {
  senderFirstName: string
  senderLastName: string
  recipientFirstName: string
  recipientLastName: string
  email: string
  senderEmail: string
  amount: Decimal
  memo: string
}): Promise<boolean> => {
  return sendEMail({
    to: `${data.recipientFirstName} ${data.recipientLastName} <${data.email}>`,
    subject: transactionReceived.de.subject,
    text: transactionReceived.de.text(data),
  })
}
