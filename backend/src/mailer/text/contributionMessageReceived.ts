export const contributionMessageReceived = {
  de: {
    subject: 'Nachricht zu Deinem Gemeinwohl-Beitrag',
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

du hast zu deinem Gemeinwohl-Beitrag "${data.contributionMemo}" eine Nachricht von ${data.senderFirstName} ${data.senderLastName} erhalten.

Um die Nachricht zu sehen und darauf zu antworten, gehe in deinem Gradido-Konto ins Menü "Gemeinschaft" auf den Tab "Meine Beiträge zum Gemeinwohl"!

Link zu deinem Konto: ${data.overviewURL}

Bitte antworte nicht auf diese E-Mail!

Liebe Grüße
dein Gradido-Team`,
  },
}
