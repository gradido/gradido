// AI-GENERATED — not an architecture reference
import de from '../../admin/src/locales/de.json' with { type: 'json' }
import { expect, Failure, test } from './fixtures/graphql'
import { projectBranding, spacesPage } from './fixtures/projectBrandings'
import { signedInAnswers, signIn } from './fixtures/signIn'
import { serveWalletAssets } from './fixtures/walletAssets'

type Variables = Record<string, unknown>

const garden = projectBranding(1, 'Garden', 'garden')
const bakery = projectBranding(2, 'Bakery', 'bakery')
// what upsertProjectBranding takes of Garden, as its form holds it
const gardenInput = {
  id: 1,
  name: 'Garden',
  alias: 'garden',
  description: 'About Garden',
  spaceId: 21,
  newUserToSpace: true,
  logoUrl: 'https://example.org/garden.png',
}

test.beforeEach(async ({ page, graphql }) => {
  graphql.answer({
    ...signedInAnswers(),
    projectBrandings: [garden, bakery],
    space: ({ id }: Variables) => ({
      name: `Space ${id}`,
      description: `Description of space ${id}`,
    }),
    spaces: ({ page }: Variables) => spacesPage(page as number, 45),
    // the entry as saved: a new one gets the id 9
    upsertProjectBranding: ({ input }: Variables) => ({ ...garden, id: 9, ...(input as object) }),
  })
  await serveWalletAssets(page)
  // the logos
  await page.route('https://example.org/**', (route) =>
    route.fulfill({ path: '../admin/public/img/gdd-coin.png' }),
  )
})

const entries = (page: import('@playwright/test').Page) => page.locator('.project-branding-item')
const form = (page: import('@playwright/test').Page) => page.locator('.project-branding-form')
const save = (page: import('@playwright/test').Page) =>
  form(page).getByRole('button', { name: de.save }).click()

test('lists the project brandings, asking once', async ({ page, graphql }) => {
  await signIn(page, '/projectBranding')

  await expect(entries(page)).toHaveCount(2)
  const first = entries(page).nth(0)
  await expect(first).toContainText('Garden')
  await expect(first).toContainText(/\/login\?project=garden/)
  await expect(first.locator('.row').first()).toHaveAttribute('title', 'About Garden')
  await expect(first.locator('.text-success svg')).toBeVisible()
  await expect(entries(page).nth(1).locator('.text-danger svg')).toBeVisible()
  await expect(first.locator('img')).toHaveAttribute('src', 'https://example.org/garden.png')
  expect(graphql.sentFor('projectBrandings')).toHaveLength(1)
})

test('reports a failed list', async ({ page, graphql }) => {
  graphql.answer({ projectBrandings: new Failure('database down') })
  await signIn(page, '/projectBranding')

  await expect(page.getByRole('alert')).toContainText('database down')
  await expect(entries(page)).toHaveCount(0)
})

test('asks again on refresh and shows the new list', async ({ page, graphql }) => {
  await signIn(page, '/projectBranding')
  await expect(entries(page)).toHaveCount(2)
  graphql.answer({ projectBrandings: [bakery] })
  await page.getByTestId('project-branding-refresh-btn').click()

  await expect(entries(page)).toHaveCount(1)
  await expect(entries(page).nth(0)).toContainText('Bakery')
  expect(graphql.sentFor('projectBrandings')).toHaveLength(2)
})

test('copies the login link of an entry', async ({ page, context }) => {
  await context.grantPermissions(['clipboard-read', 'clipboard-write'])
  await signIn(page, '/projectBranding')
  await entries(page).nth(0).getByRole('button', { name: de['copy-to-clipboard'] }).click()

  await expect(page.getByRole('alert')).toContainText(de['copied-to-clipboard'])
  expect(await page.evaluate(() => navigator.clipboard.readText())).toMatch(
    /^http.*\/login\?project=garden$/,
  )
  // the click on the button opens no details
  await expect(page.locator('.details')).toHaveCount(0)
})

test('deletes an entry', async ({ page, graphql }) => {
  graphql.answer({ deleteProjectBranding: true })
  await signIn(page, '/projectBranding')
  await entries(page).nth(0).getByRole('button', { name: de.delete }).click()

  await expect(entries(page)).toHaveCount(1)
  await expect(entries(page).nth(0)).toContainText('Bakery')
  expect(graphql.sentFor('deleteProjectBranding')).toEqual([
    { field: 'deleteProjectBranding', variables: { id: 1 } },
  ])
})

test('opens the form of an entry with a click on it, and closes it with another', async ({
  page,
}) => {
  await signIn(page, '/projectBranding')
  const row = entries(page).nth(0).locator('.row').first()
  await row.click()

  await expect(form(page)).toHaveCount(1)
  await expect(page.getByLabel(de.name, { exact: true })).toHaveValue('Garden')
  await expect(page.getByLabel(de.alias)).toHaveValue('garden')
  await expect(page.getByLabel(de.description)).toHaveValue('About Garden')
  await expect(page.locator('#newUserToSpace-input-field')).toBeChecked()
  await expect(page.getByLabel(de.logo)).toHaveValue('https://example.org/garden.png')
  await expect(
    form(page).getByRole('button', { name: 'Gewählter Space: Space 21' }),
  ).toHaveAttribute('title', 'Description of space 21')
  await row.click()
  await expect(form(page)).toHaveCount(0)
})

test('saves a changed entry, only with the fields of the form', async ({ page, graphql }) => {
  await signIn(page, '/projectBranding')
  await entries(page).nth(0).locator('.row').first().click()
  await page.getByLabel(de.name, { exact: true }).fill('Garden club')
  await page.locator('#newUserToSpace-input-field').uncheck()
  await save(page)

  await expect(page.getByRole('alert')).toContainText(de.projectBranding.updated)
  expect(graphql.sentFor('upsertProjectBranding')).toEqual([
    {
      field: 'upsertProjectBranding',
      variables: { input: { ...gardenInput, name: 'Garden club', newUserToSpace: false } },
    },
  ])
  await expect(form(page)).toHaveCount(0)
  await expect(entries(page).nth(0)).toContainText('Garden club')
  await expect(entries(page).nth(0).locator('.text-danger svg')).toBeVisible()
})

test('reports a failed save and keeps the form open', async ({ page, graphql }) => {
  graphql.answer({ upsertProjectBranding: new Failure('alias taken') })
  await signIn(page, '/projectBranding')
  await entries(page).nth(0).locator('.row').first().click()
  await save(page)

  await expect(page.getByRole('alert')).toContainText(
    de.projectBranding.error.replace('{message}', 'alias taken'),
  )
  await expect(form(page)).toHaveCount(1)
})

test('checks the fields as they are typed and saves nothing wrong', async ({ page, graphql }) => {
  await signIn(page, '/projectBranding')
  await entries(page).nth(0).locator('.row').first().click()
  const name = page.getByLabel(de.name, { exact: true })
  await expect(name).toHaveClass(/is-valid/)
  await name.fill('ab')
  await expect(name).toHaveClass(/is-invalid/)
  await expect(page.locator('.input-name .invalid-feedback')).toHaveText(
    'this must be at least 3 characters',
  )
  const logo = page.getByLabel(de.logo)
  await logo.fill('nope')
  await expect(page.locator('.input-logoUrl .invalid-feedback')).toHaveText(
    'Logo URL must be a valid URL.',
  )
  // an optional field left empty is neither valid nor invalid
  await logo.fill('')
  await expect(logo).not.toHaveClass(/is-(in)?valid/)
  await save(page)

  await expect(form(page).locator('form > .invalid-feedback')).toHaveText(
    'name must be at least 3 characters',
  )
  expect(graphql.sentFor('upsertProjectBranding')).toEqual([])
})

test('resets the form to the saved entry', async ({ page }) => {
  await signIn(page, '/projectBranding')
  await entries(page).nth(0).locator('.row').first().click()
  const name = page.getByLabel(de.name, { exact: true })
  await name.fill('ab')
  await save(page)
  await expect(form(page).locator('form > .invalid-feedback')).toBeVisible()
  await form(page).getByRole('button', { name: de.reset }).click()

  await expect(name).toHaveValue('Garden')
  await expect(name).toHaveClass(/is-valid/)
  await expect(form(page).locator('form > .invalid-feedback')).toHaveCount(0)
})

test('adds a new entry, one at a time', async ({ page, graphql }) => {
  await signIn(page, '/projectBranding')
  const add = page.getByTestId('project-branding-add-btn')
  await add.click()

  await expect(entries(page)).toHaveCount(3)
  await expect(add).toBeDisabled()
  const added = entries(page).nth(2)
  await expect(added.getByRole('button', { name: de.projectBranding.selectSpace })).toBeVisible()
  await added.getByLabel(de.name, { exact: true }).fill('Corner shop')
  await added.getByLabel(de.alias).fill('corner')
  await added.getByRole('button', { name: de.save }).click()

  await expect(page.getByRole('alert')).toContainText(de.projectBranding.created)
  expect(graphql.sentFor('upsertProjectBranding')).toEqual([
    {
      field: 'upsertProjectBranding',
      variables: { input: { name: 'Corner shop', alias: 'corner', newUserToSpace: false } },
    },
  ])
  await expect(add).toBeEnabled()
  await expect(entries(page).nth(2)).toContainText('Corner shop')
  await expect(page.locator('.details')).toHaveCount(0)
})

test('chooses the Humhub space from the page of the one chosen', async ({ page, graphql }) => {
  await signIn(page, '/projectBranding')
  await entries(page).nth(0).locator('.row').first().click()
  await form(page).getByRole('button', { name: 'Gewählter Space: Space 21' }).click()

  const dialog = page.getByRole('dialog')
  await expect(dialog).toContainText(de.projectBranding.selectSpace)
  await expect(dialog.locator('li.list-group-item.active')).toHaveText(/Space 21/)
  expect(graphql.sentFor('spaces').at(-1)?.variables).toEqual({ page: 2, limit: 20 })
  await expect(
    dialog.getByRole('link', { name: de.projectBranding.openSpaceInHumhub }).first(),
  ).toHaveAttribute('href', 'https://humhub.example.org/s/space-21')
  await dialog.getByText('Space 23', { exact: true }).click()

  await expect(dialog.locator('li.list-group-item.active')).toHaveText(/Space 23/)
  await expect(form(page).getByRole('button', { name: 'Gewählter Space: Space 23' })).toBeVisible()
  await dialog.getByRole('button', { name: 'Close' }).click()
  await expect(dialog).toBeHidden()
  await save(page)

  await expect(page.getByRole('alert')).toContainText(de.projectBranding.updated)
  expect(graphql.sentFor('upsertProjectBranding')[0].variables).toEqual({
    input: { ...gardenInput, spaceId: 23, spaceUrl: 'https://humhub.example.org/s/space-23' },
  })
})

test('pages through the Humhub spaces', async ({ page, graphql }) => {
  await signIn(page, '/projectBranding')
  await entries(page).nth(0).locator('.row').first().click()
  await form(page).getByRole('button', { name: 'Gewählter Space: Space 21' }).click()
  const dialog = page.getByRole('dialog')
  await dialog.getByRole('menuitem', { name: 'Go to page 3' }).click()

  await expect(dialog.locator('li.list-group-item')).toHaveCount(5)
  await expect(dialog.locator('li.list-group-item').first()).toContainText('Space 41')
  await expect(dialog.locator('.page-item.active')).toHaveText('3')
  expect(graphql.sentFor('spaces').at(-1)?.variables).toEqual({ page: 3, limit: 20 })
})

test('says so where the chosen space cannot be read', async ({ page, graphql }) => {
  graphql.answer({ space: new Failure('no access') })
  await signIn(page, '/projectBranding')
  await entries(page).nth(0).locator('.row').first().click()

  await expect(
    form(page).getByRole('button', {
      name: de.projectBranding.noAccessRightSpace.replace('{spaceId}', '21'),
    }),
  ).toBeVisible()
})
