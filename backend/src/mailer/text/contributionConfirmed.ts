import Decimal from 'decimal.js-light'

export const contributionConfirmed = {
  de: {
    subject: 'Schöpfung wurde bestätigt',
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

Dein Gradido Schöpfungsantrag "${data.contributionMemo}" wurde soeben von ${data.senderFirstName} ${
        data.senderLastName
      } bestätigt.
Betrag: ${data.contributionAmount.toFixed(2).replace('.', ',')} GDD

Bitte antworte nicht auf diese E-Mail!

Mit freundlichen Grüßen,
dein Gradido-Team


Link zu deinem Konto: ${data.overviewURL}`,
  },
}
