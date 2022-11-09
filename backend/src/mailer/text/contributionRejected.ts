import Decimal from 'decimal.js-light'

export const contributionRejected = {
  de: {
    subject: 'Schöpfung wurde abgelehnt',
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

Dein eingereichter Gemeinwohl-Beitrag "${data.contributionMemo}" wurde soeben von ${data.senderFirstName} ${data.senderLastName} abgelehnt.
      
Bitte antworte nicht auf diese E-Mail!

Mit freundlichen Grüßen,
dein Gradido-Team


Link zu deinem Konto: ${data.overviewURL}`,
  },
}
