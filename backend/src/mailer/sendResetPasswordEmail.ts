import { sendEMail } from './sendEMail'

export const sendResetPasswordEmail = (data: {
  link: string
  firstName: string
  lastName: string
  email: string
}): Promise<boolean> => {
  return sendEMail({
    to: `${data.firstName} ${data.lastName} <${data.email}>`,
    subject: 'Gradido: Reset Password',
    text: `Hallo ${data.firstName} ${data.lastName},

Du oder jemand anderes hat für dieses Konto ein Zurücksetzen des Passworts angefordert.
Wenn du es warst, klicke bitte auf den Link: ${data.link}
oder kopiere den obigen Link in Dein Browserfenster.

Mit freundlichen Grüßen,
dein Gradido-Team`,
  })
}
