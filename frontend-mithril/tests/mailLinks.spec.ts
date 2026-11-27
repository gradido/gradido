// AI-GENERATED — not an architecture reference
// The pages a link of a mail opens that act on a click only: a mail scanner that opens every
// link must neither confirm an address nor move an account.
import { expect, Failure, test } from './fixtures/graphql'
import { samePicture } from './fixtures/picture'
import { text } from './fixtures/texts'

test('confirms a guest’s address by the button, not by opening the link', async ({
  page,
  graphql,
}, info) => {
  graphql.answer({ confirmEmail: true })
  await page.goto('confirm-email/c0nf1rm')
  await expect(page.locator('.confirm-email .h3')).toHaveText(
    text('assistedRegistration.confirm.title'),
  )
  await expect(page.locator('.confirm-email p')).toHaveText(
    text('assistedRegistration.confirm.text'),
  )
  await samePicture(page, info, 'confirm-email')
  expect(graphql.sent()).toEqual([])

  await page.getByTestId('confirm-email-action').click()
  await expect(page.locator('.test-message-headline')).toHaveText(text('message.title'))
  await expect(page.locator('.test-message-subtitle')).toHaveText(
    text('assistedRegistration.confirm.done'),
  )
  expect(graphql.sentFor('confirmEmail')[0].variables).toEqual({ code: 'c0nf1rm' })
  await page.locator('.test-message-button').click()
  await expect(page).toHaveURL(/\/login$/)
})

for (const [refusal, said] of [
  ['Could not confirm with this code', text('assistedRegistration.confirm.invalid')],
  ['Email was sent more than 24 hours ago', text('assistedRegistration.confirm.invalid')],
  ['database on fire', 'database on fire'],
]) {
  test(`says "${said.slice(0, 30)}…" where the server says "${refusal}"`, async ({
    page,
    graphql,
  }) => {
    graphql.answer({ confirmEmail: new Failure(refusal) })
    await page.goto('confirm-email/c0nf1rm')
    await page.getByTestId('confirm-email-action').click()
    await expect(page.locator('.test-message-headline')).toHaveText(text('message.errorTitle'))
    await expect(page.locator('.test-message-subtitle')).toHaveText(said)
  })
}

test('confirms a new address by the button', async ({ page, graphql }, info) => {
  graphql.answer({ confirmEmailChange: 'bibi@neu.de' })
  await page.goto('email-change/ch4nge')
  await expect(page.locator('.email-change .h3')).toHaveText(text('emailChange.confirm.title'))
  await expect(page.locator('.email-change p')).toHaveText(text('emailChange.confirm.text'))
  await expect(page.getByTestId('email-change-action')).toHaveText(
    text('emailChange.confirm.button'),
  )
  await samePicture(page, info, 'email-change')
  expect(graphql.sent()).toEqual([])

  await page.getByTestId('email-change-action').click()
  await expect(page.locator('.test-message-headline')).toHaveText(text('message.title'))
  await expect(page.locator('.test-message-subtitle')).toHaveText(text('emailChange.confirm.done'))
  expect(graphql.sentFor('confirmEmailChange')[0].variables).toEqual({ code: 'ch4nge' })
  await page.locator('.test-message-button').click()
  await expect(page).toHaveURL(/\/login$/)
})

test('revokes a change of address by the button', async ({ page, graphql }) => {
  graphql.answer({ revokeEmailChange: true })
  await page.goto('email-change/revoke/v3t0')
  await expect(page.locator('.email-change .h3')).toHaveText(text('emailChange.revoke.title'))
  await expect(page.locator('.email-change p')).toHaveText(text('emailChange.revoke.text'))
  await expect(page.getByTestId('email-change-action')).toHaveText(
    text('emailChange.revoke.button'),
  )
  await page.getByTestId('email-change-action').click()
  await expect(page.locator('.test-message-subtitle')).toHaveText(text('emailChange.revoke.done'))
  expect(graphql.sentFor('revokeEmailChange')[0].variables).toEqual({ vetoCode: 'v3t0' })
})

test('says that the link is of no use any more, each in its own words', async ({
  page,
  graphql,
}) => {
  graphql.answer({
    confirmEmailChange: new Failure('Invalid or expired code'),
    revokeEmailChange: new Failure('Invalid or expired code'),
  })
  await page.goto('email-change/ch4nge')
  await page.getByTestId('email-change-action').click()
  await expect(page.locator('.test-message-headline')).toHaveText(text('message.errorTitle'))
  await expect(page.locator('.test-message-subtitle')).toHaveText(text('emailChange.invalid'))

  await page.goto('email-change/revoke/v3t0')
  await page.getByTestId('email-change-action').click()
  await expect(page.locator('.test-message-subtitle')).toHaveText(
    text('emailChange.revoke.invalid'),
  )

  graphql.answer({ revokeEmailChange: new Failure('database on fire') })
  await page.goto('email-change/revoke/v3t0')
  await page.getByTestId('email-change-action').click()
  await expect(page.locator('.test-message-subtitle')).toHaveText('database on fire')
})
