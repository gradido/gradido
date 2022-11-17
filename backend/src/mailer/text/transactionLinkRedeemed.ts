import Decimal from 'decimal.js-light'

export const transactionLinkRedeemed = {
  de: {
    subject: 'Gradido-Link wurde eingelöst',
    text: (data: {
      email: string
      senderFirstName: string
      senderLastName: string
      recipientFirstName: string
      recipientLastName: string
      senderEmail: string
      amount: Decimal
      memo: string
      overviewURL: string
    }): string =>
      `Hallo ${data.recipientFirstName} ${data.recipientLastName}
  
  ${data.senderFirstName} ${data.senderLastName} (${
        data.senderEmail
      }) hat soeben deinen Link eingelöst.
  
  Betrag: ${data.amount.toFixed(2).replace('.', ',')} GDD,
  Memo: ${data.memo}
  
  Details zur Transaktion findest du in deinem Gradido-Konto: ${data.overviewURL}
  
  Bitte antworte nicht auf diese E-Mail!
  
  Mit freundlichen Grüßen,
  dein Gradido-Team`,
  },
}
