// AI-GENERATED — not an architecture reference
import type { Page } from '@playwright/test'
import de from '../../admin/src/locales/de.json' with { type: 'json' }
import { expect, Failure, test } from './fixtures/graphql'
import { memberDetailsAnswers } from './fixtures/memberDetails'
import { signedInAnswers, signIn } from './fixtures/signIn'
import { member, searchUsers } from './fixtures/users'

// what is still open per month, the oldest first, as the server sends it
const open = ['1000', '0', '250.5']

test.beforeEach(async ({ graphql }) => {
  graphql.answer({
    ...signedInAnswers(),
    ...memberDetailsAnswers,
    searchUsers: searchUsers([member(1, { creation: open })]),
    contactRefs: [],
  })
})

const form = (page: Page) => page.locator('.component-creation-formular')
const submit = (page: Page) =>
  form(page).getByRole('button', { name: de.creation_form.submit_creation })
const text = (page: Page) => form(page).locator('textarea')
const amount = (page: Page) => form(page).locator('input[type=number]')
const openRow = async (page: Page) => {
  await signIn(page, '/user')
  await page
    .locator('.search-user-table > table > tbody > tr.pointer')
    .first()
    .locator('td')
    .first()
    .click()
}

// the three months as the browser names them in German, and the day the server is told of each
const months = (page: Page) =>
  page.evaluate(() => {
    const now = new Date()
    return [2, 1, 0].map((back) => {
      const date = back ? new Date(now.getFullYear(), now.getMonth() - back, 1) : now
      return {
        month: new Intl.DateTimeFormat('de', { month: 'long' }).format(date),
        year: String(date.getFullYear()),
        date: new Intl.DateTimeFormat('en', {
          year: 'numeric',
          month: 'numeric',
          day: 'numeric',
        }).format(date),
      }
    })
  })

const chooseMonth = async (page: Page, index: number) => {
  const { month } = (await months(page))[index]
  await form(page)
    .getByLabel(new RegExp(`^${month}`))
    .check()
}

test('offers the three months with what is still open in each', async ({ page }) => {
  await openRow(page)
  const [a, b, c] = await months(page)

  await expect(form(page).locator('.form-check-label')).toHaveText([
    `${a.month} 1000 GDD`,
    `${b.month} 0 GDD`,
    `${c.month} 250.5 GDD`,
  ])
  await expect(amount(page)).toHaveCount(0)
  await expect(text(page)).toHaveClass(/is-invalid/)
  await expect(submit(page)).toBeDisabled()
})

test('writes the text of the month chosen, over what was typed', async ({ page }) => {
  await openRow(page)
  await text(page).fill('my own words here')
  await chooseMonth(page, 0)
  const [a, , c] = await months(page)

  await expect(text(page)).toHaveValue(`${de.creation_form.creation_for} ${a.month} ${a.year}`)
  await expect(amount(page)).toHaveAttribute('max', '1000')
  await chooseMonth(page, 2)
  await expect(text(page)).toHaveValue(`${de.creation_form.creation_for} ${c.month} ${c.year}`)
  await expect(amount(page)).toHaveAttribute('max', '250.5')
  await expect(text(page)).toHaveClass(/is-valid/)
})

test('offers the submission only with an amount and a text of ten characters', async ({ page }) => {
  await openRow(page)
  await chooseMonth(page, 0)
  await expect(submit(page)).toBeDisabled()
  await amount(page).fill('100')
  await expect(submit(page)).toBeEnabled()
  await text(page).fill('nine char')

  await expect(submit(page)).toBeDisabled()
  await expect(text(page)).toHaveClass(/is-invalid/)
  await text(page).fill('ten chars!')
  await expect(submit(page)).toBeEnabled()
})

test('moves the slider with the amount, and the amount with the slider', async ({ page }) => {
  await openRow(page)
  await chooseMonth(page, 0)
  await form(page).locator('input[type=range]').fill('300')

  await expect(amount(page)).toHaveValue('300')
  await amount(page).fill('120')
  await expect(form(page).locator('input[type=range]')).toHaveValue('120')
})

test('makes the creation, and shows what is still open', async ({ page, graphql }) => {
  graphql.answer({ adminCreateContribution: ['1000', '0', '150.5'] })
  await openRow(page)
  await chooseMonth(page, 2)
  await amount(page).fill('100')
  await submit(page).click()

  await expect(page.getByRole('alert')).toContainText(
    de.creation_form.toasted.replace('{value}', '100').replace('{email}', 'member1@example.org'),
  )
  const { month, year, date } = (await months(page))[2]
  // the amount as a string: the server takes GradidoUnit as nothing else
  expect(graphql.sentFor('adminCreateContribution').map((sent) => sent.variables)).toEqual([
    {
      email: 'member1@example.org',
      amount: '100',
      memo: `${de.creation_form.creation_for} ${month} ${year}`,
      creationDate: date,
    },
  ])
  await expect(
    page.locator('.search-user-table > table > tbody > tr.pointer').first().locator('td').nth(4),
  ).toHaveText('1000 | 0 | 150.5')
  await expect(form(page).locator('.form-check-label').nth(2)).toHaveText(`${month} 150.5 GDD`)
  // the form starts anew
  await expect(text(page)).toHaveValue('')
  await expect(amount(page)).toHaveCount(0)
  await expect(form(page).locator('input[type=radio]:checked')).toHaveCount(0)
  // one more open creation for the menu
  expect(
    JSON.parse((await page.evaluate(() => localStorage.getItem('gradido-admin'))) ?? '{}')
      .openCreations,
  ).toBe(1)
})

test('says in its own words that a project account does not create', async ({ page, graphql }) => {
  graphql.answer({ adminCreateContribution: new Failure('CREATION_NOT_ALLOWED') })
  await openRow(page)
  await chooseMonth(page, 0)
  await amount(page).fill('50')
  await submit(page).click()

  await expect(page.getByRole('alert')).toContainText(de.creation_form.not_allowed)
  await expect(text(page)).toHaveValue('')
})

test('reports any other failure as the server gave it', async ({ page, graphql }) => {
  graphql.answer({ adminCreateContribution: new Failure('month already full') })
  await openRow(page)
  await chooseMonth(page, 0)
  await amount(page).fill('50')
  await submit(page).click()

  await expect(page.getByRole('alert')).toContainText('month already full')
})

test('starts anew on reset', async ({ page }) => {
  await openRow(page)
  await chooseMonth(page, 0)
  await amount(page).fill('50')
  await form(page).getByRole('button', { name: de.creation_form.reset }).click()

  await expect(text(page)).toHaveValue('')
  await expect(amount(page)).toHaveCount(0)
  await expect(form(page).locator('input[type=radio]:checked')).toHaveCount(0)
  await expect(submit(page)).toBeDisabled()
})

test('books a creation once, also on a double click', async ({ page, graphql }, info) => {
  test.skip(info.project.name === 'old', 'the old admin sends it again on every press')
  graphql.answer({ adminCreateContribution: open })
  await openRow(page)
  await chooseMonth(page, 0)
  await amount(page).fill('50')
  await submit(page).dblclick()

  await expect(page.getByRole('alert')).toBeVisible()
  expect(graphql.sentFor('adminCreateContribution')).toHaveLength(1)
})

test('asks for nothing as the row opens on the form', async ({ page, graphql }, info) => {
  test.skip(info.project.name === 'old', 'the old admin asks twice for amounts it never shows')
  await openRow(page)
  await expect(form(page)).toBeVisible()

  expect(graphql.sentFor('adminOpenCreations')).toEqual([])
})

test.describe('on a phone', () => {
  test.use({ viewport: { width: 390, height: 1200 } })

  test('sets the months under each other', async ({ page }) => {
    await signIn(page, '/user')
    await page
      .locator('.search-user-table > table > tbody > tr.pointer')
      .first()
      .getByRole('button', { name: de.show_details })
      .click()

    await expect(form(page).locator('.form-check')).toHaveCount(3)
    await expect(form(page).locator('.form-check-inline')).toHaveCount(0)
  })
})
