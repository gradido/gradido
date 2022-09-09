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

Du hast soeben zu deinem eingereichten Gradido Schöpfungsantrag "${data.contributionMemo}" eine Rückfrage von ${data.senderFirstName} ${data.senderLastName} erhalten.
Die Rückfrage lautet:

${data.message}

Bitte antworte nicht auf diese E-Mail!

Mit freundlichen Grüßen,
dein Gradido-Team


Link zu deinem Konto: ${data.overviewURL}`,
  },
}
