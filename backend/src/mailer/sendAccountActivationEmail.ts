import { sendEMail } from './sendEMail'

export const sendAccountActivationEmail = (data: {
  link: string
  firstName: string
  lastName: string
  email: string
}): Promise<boolean> => {
  return sendEMail({
    to: `${data.firstName} ${data.lastName} <${data.email}>`,
    subject: 'Gradido: E-Mail Überprüfung',
    text: `Hallo ${data.firstName} ${data.lastName},

Deine EMail wurde soeben bei Gradido registriert.

Klicke bitte auf diesen Link, um die Registrierung abzuschließen und dein Gradido-Konto zu aktivieren:
${data.link}
oder kopiere den obigen Link in dein Browserfenster.

Mit freundlichen Grüßen,
dein Gradido-Team`,
  })
}
