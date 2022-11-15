import Decimal from 'decimal.js-light'

export const contributionRejected = {
  de: {
    subject: 'Dein Gemeinwohl-Beitrag wurde abgelehnt',
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

dein Gemeinwohl-Beitrag "${data.contributionMemo}" wurde von ${data.senderFirstName} ${data.senderLastName} abgelehnt.

Um deine Gemeinwohl-Beiträge und dazugehörige Nachrichten zu sehen, gehe in deinem Gradido-Konto ins Menü "Gemeinschaft" auf den Tab "Meine Beiträge zum Gemeinwohl"!

Link zu deinem Konto: ${data.overviewURL}

Bitte antworte nicht auf diese E-Mail!

Liebe Grüße
dein Gradido-Team`,
  },
}
