/// <reference types='cypress' />

export class SendPage {
  confirmationBox = '.transaction-confirm-send'
  submitBtn = '.btn-gradido'

  enterReceiverEmail(email: string) {
    cy.get('[data-test="input-identifier"]').find('input')
      .clear()
      .type(email)
    return this
  }

  enterAmount(amount: string) {
    cy.get('[data-test="input-amount"]')
      .find('input')
      .clear()
      .type(amount)
    return this
  }

  enterMemoText(text: string) {
    cy.get('[data-test="input-textarea"]')
      .find('textarea')
      .clear()
      .type(text)
    return this
  }

  submit() {
    cy.get(this.submitBtn)
      .click()
  }
}
