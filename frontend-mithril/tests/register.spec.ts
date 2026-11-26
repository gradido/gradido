// AI-GENERATED — not an architecture reference
import { expect, Failure, test } from './fixtures/graphql'
import { samePicture } from './fixtures/picture'
import { text } from './fixtures/texts'

const toast = '.gdd-toaster-body'
const send = 'form button[type="submit"]'
// in an hour, and sealed: only its first part is read here
const guarantorCode = () => `${Math.floor(Date.now() / 1000) + 3600}.seal-AAAA_BBBB`

/** What is wrong with the field `id`, as the page says it. */
const feedbackOf = (page: import('@playwright/test').Page, id: string) =>
  page.locator('.b-form-group', { has: page.locator(`#${id}`) }).locator('.invalid-feedback')

async function fillIn(page: import('@playwright/test').Page) {
  await page.locator('#registerFirstname').fill('Bibi')
  await page.locator('#registerLastname').fill('Bloxberg')
  await page.locator('#email-input-field').fill('bibi@bloxberg.de')
  await page.locator('#registerCheckbox').check()
}

test('opens an account with name, address and consent', async ({ page, graphql }, info) => {
  graphql.answer({ createUser: true })
  await page.goto('register')
  await expect(page.locator(send)).toBeDisabled()
  await samePicture(page, info, 'register')

  await page.locator('#registerFirstname').fill('Bibi')
  await page.locator('#registerLastname').fill('Bloxberg')
  await page.locator('#email-input-field').fill('bibi@bloxberg.de')
  // not without the consent
  await expect(page.locator(send)).toBeDisabled()
  await page.locator('#registerCheckbox').check()
  await expect(page.locator(send)).toBeEnabled()
  await samePicture(page, info, 'register-filled')
  await page.locator(send).click()

  await expect(page.locator('.test-message-headline')).toHaveText(text('message.title'))
  await expect(page.locator('.test-message-subtitle')).toHaveText(text('message.register'))
  await expect(page.locator('.test-message-button')).toHaveCount(0)
  await samePicture(page, info, 'register-done')
  const sent = graphql.sentFor('createUser')[0].variables
  expect(sent).toMatchObject({
    email: 'bibi@bloxberg.de',
    firstName: 'Bibi',
    lastName: 'Bloxberg',
    language: 'de',
  })
  // nothing of what a code, a referrer or a guarantor would add
  for (const none of ['redeemCode', 'referrerAlias', 'guarantorCode', 'password', 'project']) {
    expect(sent[none] ?? null).toBeNull()
  }
})

test('says what is wrong with a field once it was left', async ({ page, graphql: _backend }) => {
  await page.goto('register')
  await page.locator('#registerFirstname').fill('Bi')
  await expect(feedbackOf(page, 'registerFirstname')).toBeHidden()
  await page.locator('#registerFirstname').blur()
  await expect(feedbackOf(page, 'registerFirstname')).toHaveText(
    text('form.validation.minLength', { fieldName: text('form.firstname'), min: 3 }),
  )
  await expect(page.locator('#registerFirstname')).toHaveClass(/is-invalid/)

  await page.locator('#registerLastname').fill('B')
  await page.locator('#registerLastname').blur()
  await expect(feedbackOf(page, 'registerLastname')).toHaveText(
    text('form.validation.minLength', { fieldName: text('form.lastname'), min: 2 }),
  )
  await page.locator('#registerLastname').fill('')
  await expect(feedbackOf(page, 'registerLastname')).toHaveText(
    text('form.validation.requiredField', { fieldName: text('form.lastname') }),
  )

  await page.locator('#email-input-field').fill('bibi@')
  await page.locator('#email-input-field').blur()
  await expect(feedbackOf(page, 'email-input-field')).toHaveText(
    text('form.validation.email', { fieldName: text('form.email') }),
  )
  await page.locator('#registerFirstname').fill('Bibi')
  await expect(page.locator('#registerFirstname')).toHaveClass(/is-valid/)
  await expect(page.locator(send)).toBeDisabled()
})

test('says what the server said where it refuses', async ({ page, graphql }) => {
  graphql.answer({ createUser: new Failure('database on fire') })
  await page.goto('register')
  await fillIn(page)
  await page.locator(send).click()
  await expect(page.locator(toast)).toHaveText(`${text('error.unknown-error')} database on fire`)
  // what was typed stays
  await expect(page.locator('#registerFirstname')).toHaveValue('Bibi')
})

test('takes the code of a link and its community along', async ({ page, graphql }) => {
  graphql.answer({ createUser: true })
  await page.goto('register/c0de?codeCommunityUuid=f1e2d3c4-b5a6-4978-8695-a4b3c2d1e0f9')
  // the way to the sign-in keeps both
  await expect(
    page.locator('#registerform').getByRole('link', { name: text('signin') }),
  ).toHaveAttribute('href', '/login/c0de?codeCommunityUuid=f1e2d3c4-b5a6-4978-8695-a4b3c2d1e0f9')
  await fillIn(page)
  await page.locator(send).click()
  await expect(page.locator('.test-message-headline')).toBeVisible()
  expect(graphql.sentFor('createUser')[0].variables).toMatchObject({
    redeemCode: 'c0de',
    redeemCodeCommunityUuid: 'f1e2d3c4-b5a6-4978-8695-a4b3c2d1e0f9',
  })
})

test('names who showed Gradido, where that is a user name', async ({ page, graphql }) => {
  graphql.answer({ createUser: true })
  await page.goto('register?referrer=bibi_b')
  await expect(page.getByTestId('register-shown-by')).toHaveText(
    text('site.signup.shownBy', { name: 'bibi_b' }),
  )
  await fillIn(page)
  await page.locator(send).click()
  await expect(page.locator('.test-message-headline')).toBeVisible()
  expect(graphql.sentFor('createUser')[0].variables).toMatchObject({ referrerAlias: 'bibi_b' })

  // no user name: neither shown nor sent
  for (const none of ['a%20b', 'admin', 'ab']) {
    await page.goto(`register?referrer=${none}`)
    await expect(page.locator('#registerFirstname')).toBeVisible()
    await expect(page.getByTestId('register-shown-by')).toHaveCount(0)
  }
})

test('lets a guest choose the password where a member vouches', async ({ page, graphql }, info) => {
  graphql.answer({ createUser: true })
  const code = guarantorCode()
  await page.goto(`register?referrer=bibi&guarantor=${code}`)
  await expect(page.getByTestId('register-guarantor-hint')).toHaveText(
    text('site.signup.guarantorHint', { name: 'bibi' }),
  )
  await fillIn(page)
  await expect(page.locator(send)).toBeDisabled()

  // every rule the password breaks, once the field was left
  await page.locator('#newPassword-input-field').fill('abc')
  await page.locator('#newPassword-input-field').blur()
  const rules = feedbackOf(page, 'newPassword-input-field')
  for (const broken of ['uppercase', 'one_number', 'minimum', 'special-char']) {
    await expect(rules).toContainText(text(`site.signup.${broken}`))
  }
  await expect(rules).not.toContainText(text('site.signup.lowercase'))
  await samePicture(page, info, 'register-guarantor')

  await page.locator('#newPassword-input-field').fill('Aa12345_')
  await expect(rules).toBeHidden()
  await page.locator('#newPasswordRepeat-input-field').fill('Aa12345')
  await page.locator('#newPasswordRepeat-input-field').blur()
  await expect(feedbackOf(page, 'newPasswordRepeat-input-field')).toHaveText(
    text('site.signup.dont_match'),
  )
  await expect(page.locator(send)).toBeDisabled()
  await page.locator('#newPasswordRepeat-input-field').fill('Aa12345_')
  await page.locator(send).click()

  await expect(page.locator('.test-message-subtitle')).toHaveText(text('message.registerGuarantor'))
  expect(graphql.sentFor('createUser')[0].variables).toMatchObject({
    referrerAlias: 'bibi',
    guarantorCode: code,
    password: 'Aa12345_',
  })
  await page.locator('.test-message-button').click()
  await expect(page).toHaveURL(/\/login$/)
})

test('shows a password typed, and hides it again', async ({ page, graphql: _backend }) => {
  await page.goto(`register?guarantor=${guarantorCode()}`)
  // without a name the sentence speaks of the member
  await expect(page.getByTestId('register-guarantor-hint')).toHaveText(
    text('site.signup.guarantorHintAnonymous'),
  )
  const password = page.locator('#newPassword-input-field')
  const eye = page.getByTestId('password-eye').first()
  await password.fill('Aa12345_')
  await expect(password).toHaveAttribute('type', 'password')
  await expect(eye).toHaveAccessibleName(text('form.showPassword'))
  await eye.click()
  await expect(password).toHaveAttribute('type', 'text')
  await expect(eye).toHaveAccessibleName(text('form.hidePassword'))
  await expect(password).toHaveValue('Aa12345_')
  await eye.click()
  await expect(password).toHaveAttribute('type', 'password')
})

test('is the plain form where the guarantor code had run out', async ({ page, graphql }) => {
  graphql.answer({ createUser: true })
  await page.goto('register?referrer=bibi&guarantor=1000000000.seal-AAAA_BBBB')
  await expect(page.getByTestId('register-guarantor-expired')).toHaveText(
    text('site.signup.guarantorExpired'),
  )
  await expect(page.locator('#newPassword-input-field')).toHaveCount(0)
  await fillIn(page)
  await page.locator(send).click()
  await expect(page.locator('.test-message-subtitle')).toHaveText(text('message.register'))
  expect(graphql.sentFor('createUser')[0].variables.guarantorCode ?? null).toBeNull()
})

test('says so beside the button where the code ran out meanwhile, or the member vouches for enough', async ({
  page,
  graphql,
}) => {
  await page.goto(`register?referrer=bibi&guarantor=${guarantorCode()}`)
  await fillIn(page)
  await page.locator('#newPassword-input-field').fill('Aa12345_')
  await page.locator('#newPasswordRepeat-input-field').fill('Aa12345_')

  graphql.answer({ createUser: new Failure('Guarantor code invalid or expired') })
  await page.locator(send).click()
  await expect(page.getByTestId('register-guarantor-failed')).toHaveText(
    text('site.signup.guarantorFailed'),
  )
  await expect(page.locator(toast)).toHaveCount(0)

  graphql.answer({ createUser: new Failure('Vouching limit reached') })
  await page.locator(send).click()
  await expect(page.getByTestId('register-guarantor-limit')).toHaveText(
    text('site.signup.guarantorLimit', { name: 'bibi' }),
  )
  await expect(page.getByTestId('register-guarantor-failed')).toHaveCount(0)
  // what was typed stays
  await expect(page.locator('#newPassword-input-field')).toHaveValue('Aa12345_')
})

test('registers for the project its address names', async ({ page, graphql }) => {
  graphql.answer({ projectBrandingBanner: null, createUser: true })
  await page.goto('register?project=garden')
  await fillIn(page)
  await page.locator(send).click()
  await expect(page.locator('.test-message-headline')).toBeVisible()
  expect(graphql.sentFor('createUser')[0].variables).toMatchObject({ project: 'garden' })
})
