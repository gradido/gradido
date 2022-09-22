export const contributionMessageReceived = {
  de: {
    subject: 'Gradido Frage zur Schöpfung',
    text: (data: {
      senderFirstName: string
      senderLastName: string
      recipientFirstName: string
      recipientLastName: string
      recipientEmail: string
      senderEmail: string
      contributionMemo: string
      message: string
      overviewURL: string
    }): string =>
      `Hallo ${data.recipientFirstName} ${data.recipientLastName},

du hast soeben zu deinem eingereichten Gemeinwohl-Beitrag "${data.contributionMemo}" eine Rückfrage von ${data.senderFirstName} ${data.senderLastName} erhalten.

Bitte beantworte die Rückfrage in deinem Gradido-Konto im Menü "Gemeinschaft" im Tab "Meine Beiträge zum Gemeinwohl"!

Link zu deinem Konto: ${data.overviewURL}

Bitte antworte nicht auf diese E-Mail!

Mit freundlichen Grüßen,
dein Gradido-Team`,
  },
}
