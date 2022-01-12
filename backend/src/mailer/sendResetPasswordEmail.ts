import { sendEMail } from './sendEMail'

export const sendResetPasswordEmail = (
  resetLink: string,
  firstName: string,
  lastName: string,
  email: string,
): Promise<boolean> => {
  return sendEMail({
    to: `${firstName} ${lastName} <${email}>`,
    subject: 'Gradido: Reset Password',
    text: `Hallo ${firstName} ${lastName},

Du oder jemand anderes hat für dieses Konto ein Zurücksetzen des Passworts angefordert.
Wenn du es warst, klicke bitte auf den Link: ${resetLink}
oder kopiere den obigen Link in Dein Browserfenster.

Mit freundlichen Grüßen,
dein Gradido-Team`,
  })
}
