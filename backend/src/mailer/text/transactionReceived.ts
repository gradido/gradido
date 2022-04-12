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


Link zur Übersicht: <a href="${data.overviewURL}">Deine Übersicht</a>`,
  },
}
