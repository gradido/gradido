import { sendEMail } from './sendEMail'

export const sendTransactionReceivedEmail = (data: {
  senderFirstName: string
  senderLastName: string
  recipientFirstName: string
  recipientLastName: string
  email: string
  amount: number
  memo: string
}): Promise<boolean> => {
  return sendEMail({
    to: `${data.recipientFirstName} ${data.recipientLastName} <${data.email}>`,
    subject: 'Gradido Überweisung',
    text: `Hallo ${data.recipientFirstName} ${data.recipientLastName}

Du hast soeben ${data.amount.toFixed(2).replace('.', ',')} GDD von ${data.senderFirstName} ${
      data.senderLastName
    } erhalten.
${data.senderFirstName} ${data.senderLastName} schreibt:

${data.memo}

Bitte antworte nicht auf diese E-Mail!

Mit freundlichen Grüßen,
dein Gradido-Team`,
  })
}
