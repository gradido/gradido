import Decimal from 'decimal.js-light'

export const transactionReceived = {
  de: {
    subject: 'Gradido Überweisung',
    text: (data: {
      senderFirstName: string
      senderLastName: string
      recipientFirstName: string
      recipientLastName: string
      email: string
      senderEmail: string
      amount: Decimal
      memo: string
      overviewURL: string
    }): string =>
      `Hallo ${data.recipientFirstName} ${data.recipientLastName}

Du hast soeben ${data.amount.toFixed(2).replace('.', ',')} GDD von ${data.senderFirstName} ${
        data.senderLastName
      } (${data.senderEmail}) erhalten.
${data.senderFirstName} ${data.senderLastName} schreibt:

${data.memo}

Bitte antworte nicht auf diese E-Mail!

Mit freundlichen Grüßen,
dein Gradido-Team


Link zu deinem Konto: ${data.overviewURL}`,
  },
}

export const transactionLinkRedeemed = {
  de: {
    subject: 'Gradido link eingelösst',
    text: (data: {
      email: string
      senderFirstName: string
      senderLastName: string
      recipientFirstName: string
      recipientLastName: string
      senderEmail: string
      amount: Decimal
      memo: string
      overviewURL: string
    }): string =>
      `Hallo ${data.recipientFirstName} ${data.recipientLastName}

${data.senderFirstName} ${data.senderLastName} (${
        data.senderEmail
      }) hat soeben deinen Link eingelösst.
Du hattest ihm ${data.amount.toFixed(2).replace('.', ',')} GDD,
mit dem folgenden Text:

${data.memo}

gesendet.

Bitte antworte nicht auf diese E-Mail!

Mit freundlichen Grüßen,
dein Gradido-Team

Link zu deinem Konto: ${data.overviewURL}`,
  },
}
