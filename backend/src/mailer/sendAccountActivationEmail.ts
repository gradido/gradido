import { sendEMail } from './sendEMail'

export const sendAccountActivationEmail = (
  activationLink: string,
  firstName: string,
  lastName: string,
  email: string,
): Promise<boolean> => {
  return sendEMail({
    to: `${firstName} ${lastName} <${email}>`,
    subject: 'Gradido: E-Mail Überprüfung',
    text: `Hallo ${firstName} ${lastName},

Deine EMail wurde soeben bei Gradido registriert.

Klicke bitte auf diesen Link, um die Registrierung abzuschließen und dein Gradido-Konto zu aktivieren:
${activationLink}
oder kopiere den obigen Link in dein Browserfenster.

Mit freundlichen Grüßen,
dein Gradido-Team`,
  })
}
