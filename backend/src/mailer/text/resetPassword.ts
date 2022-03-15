export const resetPassword = {
  de: {
    subject: 'Gradido: Passwort zurücksetzen',
    text: (data: { link: string; firstName: string; lastName: string; email: string }): string =>
      `Hallo ${data.firstName} ${data.lastName},

Du oder jemand anderes hat für dieses Konto ein Zurücksetzen des Passworts angefordert.
Wenn du es warst, klicke bitte auf den Link: ${data.link}
oder kopiere den obigen Link in Dein Browserfenster.

Mit freundlichen Grüßen,
dein Gradido-Team`,
  },
}
