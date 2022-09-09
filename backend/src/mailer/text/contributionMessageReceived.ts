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
      `Hallo ${data.recipientFirstName} ${data.recipientLastName}

Du hast soeben eine nachfrage zur Schöpfung "${data.contributionMemo}" von ${data.senderFirstName} ${data.senderLastName} (${data.senderEmail}) erhalten.
${data.senderFirstName} ${data.senderLastName} schreibt:

${data.message}

Bitte antworte nicht auf diese E-Mail!

Mit freundlichen Grüßen,
dein Gradido-Team


Link zu deinem Konto: ${data.overviewURL}`,
  },
}
