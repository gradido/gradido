// AI-GENERATED — not an architecture reference
import type { Page } from '@playwright/test'
import de from '../../admin/src/locales/de.json' with { type: 'json' }
import { expect, Failure, test } from './fixtures/graphql'
import { signedInAnswers, signIn } from './fixtures/signIn'

type Variables = Record<string, unknown>
const words = de.creationGroupsAdmin

const group = (id: number, more: Record<string, unknown> = {}) => ({
  id,
  tag: `tag${id}`,
  name: `Group ${id}`,
  hashtagsAdoptedAt: null,
  hashtagsAdoptedCount: null,
  ...more,
})
const GROUPS = [
  group(1),
  group(2, { name: null, hashtagsAdoptedAt: '2026-10-01T10:00:00.000Z', hashtagsAdoptedCount: 3 }),
  group(3, { hashtagsAdoptedAt: '2026-10-02T10:00:00.000Z', hashtagsAdoptedCount: 0 }),
]

test.use({ timezoneId: 'Europe/Berlin' })

test.beforeEach(async ({ graphql }) => {
  graphql.answer({ ...signedInAnswers(), creationGroups: GROUPS })
})

const rows = (page: Page) => page.locator('.creation-group-list > li')
const row = (page: Page, index: number) => rows(page).nth(index)
const field = (page: Page, label: string) => page.getByRole('textbox', { name: label, exact: true })
const addButton = (page: Page) => page.getByRole('button', { name: words.add, exact: true })
const dialog = (page: Page) => page.getByRole('dialog')
const asked = (graphql: { sentFor: (field: string) => { variables: Variables }[] }, name: string) =>
  graphql.sentFor(name).map((sent) => sent.variables)
const open = async (page: Page) => {
  await signIn(page, '/creation-groups')
  await expect(rows(page)).toHaveCount(3)
}

test('lists the groups, and where their old hashtags stand', async ({ page }) => {
  await open(page)

  await expect(page.locator('.h2')).toHaveText(words.title)
  await expect(row(page, 0)).toContainText(`Group 1#tag1${words.adoption.stateUnchecked}`)
  // a group without a name shows a dash for it
  await expect(row(page, 1)).toContainText('—#tag2geprüft am 1.10.2026 — 3 übernommen')
  await expect(row(page, 2)).toContainText('geprüft am 2.10.2026 — nichts gefunden')
})

test('says so where there is no group yet', async ({ page, graphql }) => {
  graphql.answer({ creationGroups: [] })
  await signIn(page, '/creation-groups')

  await expect(page.getByText(words.empty)).toBeVisible()
})

test('says where the groups could not be read', async ({ page, graphql }) => {
  graphql.answer({ creationGroups: new Failure('no database') })
  await signIn(page, '/creation-groups')

  await expect(page.getByRole('alert')).toContainText('no database')
})

test.describe('a new group', () => {
  test('takes its tag from the name, until the tag is typed by hand', async ({ page }) => {
    await open(page)
    await expect(addButton(page)).toBeDisabled()

    await field(page, words.name).fill('  Freiwillige   Feuerwehr Mühlheim! ')
    await expect(field(page, words.tag)).toHaveValue('freiwillige-feuerwehr-mühlheim')
    await expect(addButton(page)).toBeEnabled()

    await field(page, words.tag).fill('ff')
    await field(page, words.name).fill('Feuerwehr')
    await expect(field(page, words.tag)).toHaveValue('ff')

    // spaces alone are no tag
    await field(page, words.tag).fill('   ')
    await expect(addButton(page)).toBeDisabled()
  })

  test('is added, and the list read anew', async ({ page, graphql }) => {
    graphql.answer({ addCreationGroup: group(4) })
    await open(page)

    await field(page, words.tag).fill(' ff ')
    await addButton(page).click()

    await expect(page.getByRole('alert')).toContainText(words.created)
    expect(asked(graphql, 'addCreationGroup')).toEqual([{ tag: 'ff', name: null }])
    await expect(field(page, words.tag)).toHaveValue('')
    expect(graphql.sentFor('creationGroups')).toHaveLength(2)

    // the form starts over: the name suggests the tag again
    await field(page, words.name).fill(' Garden ')
    await addButton(page).click()
    await expect.poll(() => asked(graphql, 'addCreationGroup').length).toBe(2)
    expect(asked(graphql, 'addCreationGroup')[1]).toEqual({ tag: 'garden', name: 'Garden' })
  })

  test('keeps what was typed where it could not be added', async ({ page, graphql }) => {
    graphql.answer({ addCreationGroup: new Failure('TAG_TAKEN') })
    await open(page)

    await field(page, words.name).fill('Garden')
    await addButton(page).click()

    await expect(page.getByRole('alert')).toContainText('TAG_TAKEN')
    await expect(field(page, words.name)).toHaveValue('Garden')
    await expect(field(page, words.tag)).toHaveValue('garden')
    expect(graphql.sentFor('creationGroups')).toHaveLength(1)
  })
})

test.describe('a group renamed', () => {
  test('is saved, and the list read anew', async ({ page, graphql }) => {
    graphql.answer({ editCreationGroup: group(1, { name: 'Fire' }) })
    await open(page)

    await row(page, 0).getByRole('button', { name: words.edit }).click()
    const [name, tag] = [
      row(page, 0).getByPlaceholder(words.name),
      row(page, 0).getByPlaceholder(words.tag),
    ]
    await expect(name).toHaveValue('Group 1')
    await expect(tag).toHaveValue('tag1')
    await name.fill(' ')
    await tag.fill(' fire ')
    await row(page, 0).getByRole('button', { name: words.save }).click()

    await expect(page.getByRole('alert')).toContainText(words.updated)
    expect(asked(graphql, 'editCreationGroup')).toEqual([{ id: 1, tag: 'fire', name: null }])
    await expect(row(page, 0).getByRole('button', { name: words.edit })).toBeVisible()
    expect(graphql.sentFor('creationGroups')).toHaveLength(2)
  })

  test('is one at a time, and goes back unchanged on cancel', async ({ page, graphql }) => {
    await open(page)

    await row(page, 0).getByRole('button', { name: words.edit }).click()
    await row(page, 1).getByRole('button', { name: words.edit }).click()
    await expect(page.getByPlaceholder(words.tag)).toHaveCount(1)
    await expect(row(page, 1).getByPlaceholder(words.tag)).toHaveValue('tag2')

    await row(page, 1).getByRole('button', { name: words.cancel }).click()
    await expect(page.getByPlaceholder(words.tag)).toHaveCount(0)
    expect(graphql.sentFor('editCreationGroup')).toEqual([])
  })

  test('stays open where it could not be saved', async ({ page, graphql }) => {
    graphql.answer({ editCreationGroup: new Failure('TAG_TAKEN') })
    await open(page)

    await row(page, 0).getByRole('button', { name: words.edit }).click()
    await row(page, 0).getByRole('button', { name: words.save }).click()

    await expect(page.getByRole('alert')).toContainText('TAG_TAKEN')
    await expect(row(page, 0).getByPlaceholder(words.tag)).toHaveValue('tag1')
  })
})

test.describe('the old hashtags of a group', () => {
  const check = (page: Page, index: number) =>
    row(page, index).getByRole('button', { name: words.adoption.check }).click()
  const okButton = (page: Page) => dialog(page).locator('.modal-footer .btn-primary')

  test('are counted, and taken over as chosen', async ({ page, graphql }) => {
    let answer = (_: unknown) => undefined as unknown
    graphql.answer({
      legacyHashtagCounts: () =>
        new Promise((resolve) => {
          answer = resolve
        }),
      adoptLegacyHashtags: group(1),
    })
    await open(page)

    await check(page, 0)
    await expect(dialog(page).locator('.modal-title')).toHaveText(
      'Alte Hashtags in Group 1 übernehmen',
    )
    await expect(dialog(page)).toContainText(words.adoption.searching)
    await expect(okButton(page)).toBeDisabled()
    answer({ exact: 2, loose: 1 })

    await expect(dialog(page)).toContainText('2 ältere Beiträge schreiben #tag1 im Text.')
    await expect(okButton(page)).toHaveText('3 übernehmen')
    await dialog(page).getByRole('checkbox').uncheck()
    await expect(okButton(page)).toHaveText('2 übernehmen')
    await okButton(page).click()

    await expect(page.getByRole('alert')).toContainText(words.adoption.done)
    await expect(dialog(page)).toBeHidden()
    expect(asked(graphql, 'legacyHashtagCounts')).toEqual([{ id: 1 }])
    expect(asked(graphql, 'adoptLegacyHashtags')).toEqual([{ id: 1, includeLoose: false }])
    expect(graphql.sentFor('creationGroups')).toHaveLength(2)
  })

  test('are marked as looked at where there are none', async ({ page, graphql }) => {
    graphql.answer({ legacyHashtagCounts: { exact: 0, loose: 0 }, adoptLegacyHashtags: group(2) })
    await open(page)

    // a group without a name is called by its tag
    await check(page, 1)
    await expect(dialog(page).locator('.modal-title')).toHaveText(
      'Alte Hashtags in #tag2 übernehmen',
    )
    await expect(dialog(page)).toContainText(words.adoption.foundNothing)
    await expect(dialog(page).getByRole('checkbox')).toHaveCount(0)
    await expect(okButton(page)).toHaveText(words.adoption.markChecked)
    await okButton(page).click()

    await expect(dialog(page)).toBeHidden()
    expect(asked(graphql, 'adoptLegacyHashtags')).toEqual([{ id: 2, includeLoose: true }])
  })

  test('may be only those written with a space', async ({ page, graphql }) => {
    graphql.answer({ legacyHashtagCounts: { exact: 0, loose: 2 } })
    await open(page)

    await check(page, 0)

    await expect(dialog(page)).toContainText('0 ältere Beiträge schreiben #tag1 im Text.')
    await expect(dialog(page).getByRole('checkbox')).toBeChecked()
    await expect(dialog(page)).not.toContainText(words.adoption.foundNothing)
    await expect(okButton(page)).toHaveText('2 übernehmen')
  })

  test('close the window where they could not be counted', async ({ page, graphql }) => {
    graphql.answer({ legacyHashtagCounts: new Failure('timeout') })
    await open(page)

    await check(page, 0)

    await expect(page.getByRole('alert')).toContainText('timeout')
    await expect(dialog(page)).toBeHidden()
  })

  test('leave the window open where they could not be taken over', async ({ page, graphql }) => {
    graphql.answer({
      legacyHashtagCounts: { exact: 2, loose: 0 },
      adoptLegacyHashtags: new Failure('locked'),
    })
    await open(page)

    await check(page, 0)
    await okButton(page).click()

    await expect(page.getByRole('alert')).toContainText('locked')
    await expect(dialog(page)).toBeVisible()
    await expect(okButton(page)).toHaveText('2 übernehmen')
  })

  test('are those of the group opened last, whatever answers late', async ({ page, graphql }) => {
    const held: ((answer: unknown) => void)[] = []
    graphql.answer({
      legacyHashtagCounts: ({ id }: Variables) =>
        id === 1 ? new Promise((resolve) => held.push(resolve)) : { exact: 5, loose: 0 },
      adoptLegacyHashtags: group(3),
    })
    await open(page)

    await check(page, 0)
    await dialog(page).locator('.modal-footer .btn-secondary').click()
    await expect(dialog(page)).toBeHidden()
    await check(page, 2)
    await expect(okButton(page)).toHaveText('5 übernehmen')
    await expect.poll(() => held.length).toBe(1)
    // the search of the window closed fails late: it closes nothing, and says nothing
    held[0](new Failure('timeout'))

    await page.waitForTimeout(300)
    await expect(page.getByRole('alert')).toHaveCount(0)
    await expect(okButton(page)).toHaveText('5 übernehmen')
    await okButton(page).click()
    expect(asked(graphql, 'adoptLegacyHashtags')).toEqual([{ id: 3, includeLoose: true }])
  })
})
