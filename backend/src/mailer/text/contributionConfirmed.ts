import Decimal from 'decimal.js-light'

export const contributionConfirmed = {
  de: {
    subject: 'Dein Gemeinwohl-Beitrag wurde bestätigt',
    text: (data: {
      senderFirstName: string
      senderLastName: string
      recipientFirstName: string
      recipientLastName: string
      contributionMemo: string
      contributionAmount: Decimal
      overviewURL: string
    }): string =>
      `Hallo ${data.recipientFirstName} ${data.recipientLastName},

dein Gemeinwohl-Beitrag "${data.contributionMemo}" wurde soeben von ${data.senderFirstName} ${
        data.senderLastName
      } bestätigt und in deinem Gradido-Konto gutgeschrieben.

Betrag: ${data.contributionAmount.toFixed(2).replace('.', ',')} GDD

Link zu deinem Konto: ${data.overviewURL}

Bitte antworte nicht auf diese E-Mail!

Liebe Grüße
dein Gradido-Team`,
  },
}
