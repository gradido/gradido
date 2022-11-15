import Decimal from 'decimal.js-light'

export const transactionReceived = {
  de: {
    subject: 'Du hast Gradidos erhalten',
    text: (data: {
      senderFirstName: string
      senderLastName: string
      recipientFirstName: string
      recipientLastName: string
      email: string
      senderEmail: string
      amount: Decimal
      overviewURL: string
    }): string =>
      `Hallo ${data.recipientFirstName} ${data.recipientLastName},

du hast soeben ${data.amount.toFixed(2).replace('.', ',')} GDD von ${data.senderFirstName} ${
        data.senderLastName
      } (${data.senderEmail}) erhalten.

Details zur Transaktion findest du in deinem Gradido-Konto: ${data.overviewURL}

Bitte antworte nicht auf diese E-Mail!

Liebe Grüße
dein Gradido-Team`,
  },
}
