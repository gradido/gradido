// AI-GENERATED — not an architecture reference
// The way to a new password: asking for the mail, and the page its link opens. That page is
// also where a new account gets its first password (`/checkEmail`).
import type { Page } from '@playwright/test'
import { expect, Failure, test } from './fixtures/graphql'
import { samePicture } from './fixtures/picture'
import { text } from './fixtures/texts'

const toast = '.gdd-toaster-body'
const feedbackOf = (page: Page, id: string) =>
  page.locator('.b-form-group', { has: page.locator(`#${id}`) }).locator('.invalid-feedback')

async function typeBoth(page: Page, password = 'Aa12345_') {
  await page.locator('#newPassword-input-field').fill(password)
  await page.locator('#newPasswordRepeat-input-field').fill(password)
}

test('mails the link for a new password to the address typed', async ({ page, graphql }, info) => {
  graphql.answer({ forgotPassword: true })
  await page.goto('forgot-password')
  await expect(page.getByTestId('forgot-password-subtitle')).toHaveText(
    text('settings.password.subtitle'),
  )
  await expect(page.locator('form button[type="submit"]')).toBeDisabled()
  await samePicture(page, info, 'forgot-password')

  await page.locator('#email-input-field').fill('bibi@bloxberg.de')
  await page.locator('form button[type="submit"]').click()
  await expect(page.getByTestId('forgot-password-success')).toBeVisible()
  await expect(page.locator('.test-message-headline')).toHaveText(text('message.title'))
  await expect(page.locator('.test-message-subtitle')).toHaveText(text('message.email'))
  expect(graphql.sentFor('forgotPassword')[0].variables).toEqual({ email: 'bibi@bloxberg.de' })
  await samePicture(page, info, 'forgot-password-done')

  await page.locator('.test-message-button').click()
  await expect(page).toHaveURL(/\/login$/)
})

test('says so where the mail was sent already', async ({ page, graphql }) => {
  graphql.answer({ forgotPassword: new Failure('email already sent less than 10 minutes ago') })
  await page.goto('forgot-password')
  await page.locator('#email-input-field').fill('bibi@bloxberg.de')
  // Enter sends a form only while its button is not locked
  await expect(page.locator('form button[type="submit"]')).toBeEnabled()
  await page.locator('#email-input-field').press('Enter')
  await expect(page.locator(toast)).toHaveText(text('error.email-already-sent'))
  await expect(page.getByTestId('forgot-password-error')).toBeVisible()
  await expect(page.locator('.test-message-headline')).toHaveText(text('message.errorTitle'))
  await expect(page.locator('.test-message-subtitle')).toHaveText(text('error.email-already-sent'))
})

test('keeps the form where the mail could not be asked for', async ({ page, graphql }, info) => {
  test.skip(info.project.name.startsWith('old'), 'the old wallet says the mail was sent already')
  graphql.answer({ forgotPassword: new Failure('database on fire') })
  await page.goto('forgot-password')
  await page.locator('#email-input-field').fill('bibi@bloxberg.de')
  await expect(page.locator('form button[type="submit"]')).toBeEnabled()
  await page.locator('form button[type="submit"]').click()
  await expect(page.locator(toast)).toHaveText(`${text('error.unknown-error')} database on fire`)
  // to be sent again
  await expect(page.locator('form button[type="submit"]')).toBeEnabled()
  await expect(page.getByTestId('forgot-password-error')).toHaveCount(0)
})

test('says why, to whoever comes from a link that ran out', async ({ page, graphql: _backend }) => {
  await page.goto('forgot-password/reset-password')
  await expect(page.getByTestId('forgot-password-subtitle')).toHaveText(
    text('settings.password.resend_subtitle'),
  )
})

test('sets the new password the link of the mail is for', async ({ page, graphql }, info) => {
  graphql.answer({ queryOptIn: true, setPassword: true })
  await page.goto('reset-password/0pt1n')
  const send = page.getByTestId('submit-new-password-btn')
  await expect(send).toHaveText(text('settings.password.change-password'))
  await expect(send).toBeDisabled()
  expect(graphql.sentFor('queryOptIn')[0].variables).toEqual({ optIn: '0pt1n' })
  await samePicture(page, info, 'reset-password')

  await page.locator('#newPassword-input-field').fill('abc')
  await page.locator('#newPassword-input-field').blur()
  for (const broken of ['uppercase', 'one_number', 'minimum', 'special-char']) {
    await expect(feedbackOf(page, 'newPassword-input-field')).toContainText(
      text(`site.signup.${broken}`),
    )
  }
  await samePicture(page, info, 'reset-password-rules')
  await typeBoth(page)
  await send.click()

  await expect(page.locator('.test-message-headline')).toHaveText(text('message.title'))
  await expect(page.locator('.test-message-subtitle')).toHaveText(text('message.reset'))
  expect(graphql.sentFor('setPassword')[0].variables).toEqual({
    code: '0pt1n',
    password: 'Aa12345_',
  })
  await page.locator('.test-message-button').click()
  await expect(page).toHaveURL(/\/login$/)
})

test('gives a new account its first password, and takes a link’s code on to the sign-in', async ({
  page,
  graphql,
}) => {
  graphql.answer({ queryOptIn: true, setPassword: true })
  await page.goto('checkEmail/0pt1n/c0de/f1e2d3c4-b5a6-4978-8695-a4b3c2d1e0f9')
  await expect(page.getByTestId('submit-new-password-btn')).toHaveText(
    text('settings.password.set'),
  )
  await typeBoth(page)
  await page.getByTestId('submit-new-password-btn').click()
  await expect(page.locator('.test-message-subtitle')).toHaveText(text('message.checkEmail'))
  await page.locator('.test-message-button').click()
  await expect(page).toHaveURL(
    /\/login\/c0de\?codeCommunityUuid=f1e2d3c4-b5a6-4978-8695-a4b3c2d1e0f9$/,
  )

  await page.goto('checkEmail/0pt1n')
  await typeBoth(page)
  await page.getByTestId('submit-new-password-btn').click()
  await page.locator('.test-message-button').click()
  await expect(page).toHaveURL(/\/login$/)
})

test('lets the sign-in after it say nothing until the pointer goes to its button', async ({
  page,
  graphql,
}, info) => {
  test.skip(
    info.project.name !== 'new',
    'there the button of the sign-in comes where the pointer is',
  )
  graphql.answer({ queryOptIn: true, setPassword: true })
  await page.goto('checkEmail/0pt1n')
  await typeBoth(page)
  await page.getByTestId('submit-new-password-btn').click()
  // its upper left corner: where the button of the sign-in is drawn after it
  const button = await page.locator('.test-message-button').boundingBox()
  await page.mouse.click(button!.x + 10, button!.y + 5)
  await expect(page).toHaveURL(/\/login$/)
  await expect(page.locator('form button[type="submit"]')).toBeDisabled()
  await page.mouse.move(button!.x + 11, button!.y + 6)
  await expect(page.locator('.is-invalid')).toHaveCount(0)

  await page.mouse.move(20, 20)
  await page.mouse.move(button!.x + 11, button!.y + 6)
  await expect(page.locator('.is-invalid')).toHaveCount(2)
})

test('leads to a new mail where the link is not known any more', async ({ page, graphql }) => {
  graphql.answer({ queryOptIn: new Failure('Could not find any opt in code') })
  await page.goto('reset-password/0ld')
  await expect(page.locator(toast)).toHaveText('Could not find any opt in code')
  await expect(page).toHaveURL(/\/forgot-password\/reset-password$/)
  await expect(page.getByTestId('forgot-password-subtitle')).toHaveText(
    text('settings.password.resend_subtitle'),
  )
})

test('says what the server said where it does not take the password', async ({ page, graphql }) => {
  const refusal = 'email was sent more than 23 hours and 59 minutes ago'
  graphql.answer({ queryOptIn: true, setPassword: new Failure(refusal) })
  await page.goto('reset-password/0pt1n')
  await typeBoth(page)
  await page.getByTestId('submit-new-password-btn').click()
  await expect(page.locator(toast)).toHaveText(refusal)
  await expect(page.locator('.test-message-headline')).toHaveText(text('message.errorTitle'))
  await expect(page.locator('.test-message-subtitle')).toHaveText(refusal)
  await expect(page.locator('.test-message-button')).toHaveText(text('settings.password.reset'))
  await page.locator('.test-message-button').click()
  await expect(page).toHaveURL(/\/forgot-password\/reset-password$/)
})
