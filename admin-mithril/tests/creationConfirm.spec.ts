// AI-GENERATED — not an architecture reference

import type { Page } from '@playwright/test'
import de from '../../admin/src/locales/de.json' with { type: 'json' }
import { resumedChat } from './fixtures/aiChat'
import { contributionList, groups, listedContribution } from './fixtures/contributions'
import { expect, Failure, test } from './fixtures/graphql'
import { moderator, signedInAnswers, signIn } from './fixtures/signIn'

type Variables = Record<string, unknown>
type Sent = { sentFor: (field: string) => { variables: Variables }[] }

const OPEN = ['IN_PROGRESS', 'PENDING']
const KEPT = 'gradido-admin-last-search'

// What the page asks for. Without an order the server sorts DESC as well: the old admin leaves
// it out from the second request on, so it is compared as the server reads it.
const question = (
  statusFilter: string[],
  { query = '', hideResubmission = true, creationGroup = '', currentPage = 1 } = {},
) => ({
  filter: { statusFilter, query, hideResubmission, creationGroup },
  paginated: { currentPage, pageSize: 25, order: 'DESC' },
})
const listQuestions = (graphql: Sent) =>
  graphql.sentFor('adminListContributions').map(({ variables }) => {
    const paginated = variables.paginated as Variables | undefined
    return paginated ? { ...variables, paginated: { order: 'DESC', ...paginated } } : variables
  })

const contributions = [
  listedContribution(1),
  listedContribution(2, 2, {
    contributionStatus: 'IN_PROGRESS',
    lastMessageType: 'DIALOG',
    lastMessageByModerator: true,
    creationGroups: [{ tag: 'garten', name: 'Garten' }],
    moderatorId: 9,
    moderatorUserName: 'Mod Erator',
    updatedBy: 9,
    updatedByUserName: 'Up Dater',
  }),
  listedContribution(3, 3, { lastMessageType: 'HISTORY', lastMessageByModerator: false }),
]
const own = listedContribution(4, 4, {
  user: { ...listedContribution(4).user, gradidoID: moderator.gradidoID },
})

test.beforeEach(async ({ graphql }) => {
  graphql.answer({
    ...signedInAnswers(),
    ...resumedChat,
    adminListContributions: contributionList([...contributions, own], 60),
    creationGroups: groups,
    // the old admin's menu asks for these, and shows nothing of them
    adminOpenCreations: [],
  })
})

const rows = (page: Page) => page.locator('.open-creations-table > table > tbody > tr')
const row = (page: Page, index: number) => rows(page).nth(index)
const tab = (page: Page, name: string) => page.getByRole('tab', { name })
const groupFilter = (page: Page) => page.getByTestId('creation-group-filter')
const dialog = (page: Page) => page.getByRole('dialog')
const kept = (page: Page) => page.evaluate((key) => localStorage.getItem(key), KEPT)
const keep = (page: Page, value: object) =>
  page.addInitScript(
    ([key, kept]) => localStorage.setItem(key, kept),
    [KEPT, JSON.stringify({ [moderator.gradidoID]: value })],
  )
const open = async (page: Page) => {
  await signIn(page, '/creation-confirm')
  await expect(rows(page)).toHaveCount(4)
}

test('lists the open contributions, asking once', async ({ page, graphql }) => {
  await open(page)

  expect(listQuestions(graphql)).toEqual([question(OPEN)])
  expect(graphql.sentFor('creationGroups')).toHaveLength(1)
  await expect(page.locator('.open-creations-table thead th')).toHaveText([
    de.delete,
    de.deny,
    '',
    de.name,
    de.creation,
    de.text,
    de.created,
    de.crea.column,
    de.details,
    de.save,
  ])
  // the count of the whole list, on the tab and in the menu
  await expect(page.locator('.tab-badge')).toHaveText('60')
  await expect(row(page, 0).locator('td').nth(3)).toHaveText(/First1 Last1\s+member1/)
  await expect(row(page, 0).locator('td').nth(4)).toContainText('100 GDD')
  await expect(row(page, 0).getByTestId('member-avatar')).toHaveText('ME')
  await expect(row(page, 0).locator('td').nth(6)).toHaveText(/^\S*2026$/)
  await expect(page.locator('.pagination .page-item:not(.disabled)')).toHaveText([
    '1',
    '2',
    '3',
    '›',
    '»',
  ])
})

test.describe('in a browser of another language', () => {
  test.use({ locale: 'en-US' })

  test('writes the dates in the language of the admin', async ({ page }, info) => {
    test.skip(info.project.name === 'old', "the old admin writes them in the browser's language")
    await open(page)

    await expect(row(page, 0).locator('td').nth(6)).toHaveText('1.10.2026')
  })
})

test('marks each row by its state and tells what waits in it', async ({ page }) => {
  await open(page)

  await expect(rows(page)).toHaveClass(new Array(4).fill('table-primary'))
  const details = page.locator('.open-creations-table td:nth-child(9)')
  await expect(details.locator('button[aria-expanded="false"]')).toHaveCount(3)
  await expect(details.nth(0).locator('button')).toHaveAttribute('title', de.details)
  await expect(details.nth(1).locator('button')).toHaveAttribute(
    'title',
    `${de.details} – ${de.contribution.detailsState.question}`,
  )
  await expect(details.nth(2).locator('button')).toHaveAttribute(
    'title',
    `${de.details} – ${de.contribution.detailsState.changed}`,
  )
  await expect(details.nth(2).locator('svg')).toHaveClass('details-signal')
  // who changed it and who entered it, below the text
  await expect(row(page, 1).locator('td').nth(5).locator('small')).toHaveText(
    'Text von Up Dater bearbeitet. | Erstellt von Mod Erator.',
  )
  await expect(row(page, 1).locator('.group-select .dropdown-toggle')).toHaveText('Garten')
})

test("offers no decision on the moderator's own contribution", async ({ page }) => {
  await open(page)

  for (const name of [de.delete, de.deny, de.crea.column, de.details, de.save]) {
    await expect(row(page, 3).getByTitle(name, { exact: true })).toHaveCount(0)
  }
  await expect(row(page, 3).getByTitle(de.filter.byEmail)).toBeVisible()
  await expect(row(page, 3).locator('.group-select')).toBeVisible()
})

test('shows the other states on their tabs, each from its first page', async ({
  page,
  graphql,
}) => {
  graphql.answer({
    adminListContributions: (variables: Variables) => {
      const { statusFilter } = variables.filter as { statusFilter: string[] }
      // "all" shows a confirmed one
      const status = statusFilter.length > 2 ? 'CONFIRMED' : statusFilter[0]
      return contributionList(
        [
          listedContribution(5, 5, {
            contributionStatus: status,
            closedAt: '2026-10-20T09:00:00.000Z',
            closedBy: 9,
            closedByUserName: 'Mod Erator',
            creationGroups: [{ tag: 'kueche', name: null }],
          }),
        ],
        60,
      )
    },
  })
  await signIn(page, '/creation-confirm')
  await expect(rows(page)).toHaveCount(1)
  await page.locator('.pagination').getByText('2', { exact: true }).click()
  await expect.poll(() => listQuestions(graphql).length).toBe(2)

  await tab(page, de.contributions.confirms).click()
  await expect(page.locator('#hide-resubmission')).toHaveCount(0)
  await expect(rows(page)).toHaveClass(['table-success'])
  // an administrator may test Crea on closed contributions too
  await expect(row(page, 0).getByTitle(de.crea.column)).toHaveCount(1)
  await expect(page.locator('.open-creations-table thead th')).toHaveText([
    '',
    de.name,
    de.creation,
    de.text,
    de.created,
    de.createdAt,
    de.contributions.closed,
    de.crea.column,
    de.details,
  ])
  // a closed contribution names its group, and who closed it
  await expect(row(page, 0).locator('.group-select')).toHaveCount(0)
  await expect(row(page, 0).locator('td').nth(3)).toContainText('#kueche')
  await expect(row(page, 0).locator('td').nth(3).locator('small')).toHaveText(
    'Bestätigt von Mod Erator.',
  )
  await tab(page, de.contributions.denied).click()
  await expect(rows(page)).toHaveClass(['table-warning'])
  await tab(page, de.contributions.deleted).click()
  await expect(rows(page)).toHaveClass(['table-danger'])
  await tab(page, de.contributions.all).click()
  await expect(page.locator('.open-creations-table thead th').first()).toHaveText(de.status)
  // but on "all" only on the open ones
  await expect(row(page, 0).getByRole('button', { name: de.details })).toBeVisible()
  await expect(row(page, 0).getByTitle(de.crea.column)).toHaveCount(0)

  await expect.poll(() => listQuestions(graphql).length).toBe(6)
  expect(listQuestions(graphql).slice(2)).toEqual([
    question(['CONFIRMED'], { hideResubmission: false }),
    question(['DENIED'], { hideResubmission: false }),
    question(['DELETED'], { hideResubmission: false }),
    question([...OPEN, 'CONFIRMED', 'DENIED', 'DELETED'], { hideResubmission: false }),
  ])
  // the badge counts the open ones only
  await expect(page.locator('.tab-badge')).toHaveText('60')
  expect(JSON.parse((await kept(page)) ?? '{}')[moderator.gradidoID]).toEqual({
    '/creation-confirm#tab': 4,
  })
})

test("searches from the first page, by text or by a member's address", async ({
  page,
  graphql,
}) => {
  await open(page)
  await page.locator('.pagination').getByText('2', { exact: true }).click()
  await expect.poll(() => listQuestions(graphql).length).toBe(2)

  await page.locator('.test-input-criteria').fill('garden')
  await expect.poll(() => listQuestions(graphql).length).toBe(3)
  await row(page, 1).getByTitle(de.filter.byEmail).click()
  await expect(page.locator('.test-input-criteria')).toHaveValue('member2@example.org')

  expect(listQuestions(graphql)).toEqual([
    question(OPEN),
    question(OPEN, { currentPage: 2 }),
    question(OPEN, { query: 'garden' }),
    question(OPEN, { query: 'member2@example.org' }),
  ])
  expect(JSON.parse((await kept(page)) ?? '{}')[moderator.gradidoID]).toEqual({
    '/creation-confirm': 'member2@example.org',
  })
})

test('shows what waits for a resubmission once the box is unticked', async ({ page, graphql }) => {
  await open(page)
  await expect(page.locator('label[for="hide-resubmission"]')).toHaveText(de.hide_resubmission)

  await page.locator('#hide-resubmission').uncheck()

  await expect
    .poll(() => listQuestions(graphql))
    .toEqual([question(OPEN), question(OPEN, { hideResubmission: false })])
})

test('opens on the search and tab kept, and counts the open ones apart', async ({
  page,
  graphql,
}) => {
  await keep(page, { '/creation-confirm': 'member1', '/creation-confirm#tab': 0 })
  graphql.answer({
    adminListContributions: (variables: Variables) =>
      variables.paginated
        ? contributionList([listedContribution(1)], 1)
        : { contributionCount: 42 },
  })
  await signIn(page, '/creation-confirm')

  await expect(rows(page)).toHaveCount(1)
  await expect(page.locator('.test-input-criteria')).toHaveValue('member1')
  await expect(page.locator('.tab-badge')).toHaveText('42')
  expect(listQuestions(graphql)).toEqual(
    expect.arrayContaining([
      { filter: { statusFilter: OPEN, hideResubmission: true } },
      question(OPEN, { query: 'member1' }),
    ]),
  )
  expect(listQuestions(graphql)).toHaveLength(2)
})

test('gives a kept search that finds nothing up for the whole list', async ({ page, graphql }) => {
  await keep(page, { '/creation-confirm': 'gone', '/creation-confirm#tab': 1 })
  graphql.answer({
    adminListContributions: (variables: Variables) =>
      !variables.paginated
        ? { contributionCount: 7 }
        : (variables.filter as Variables).query === 'gone'
          ? contributionList([], 0)
          : contributionList([listedContribution(1, 1, { contributionStatus: 'CONFIRMED' })], 1),
  })
  await signIn(page, '/creation-confirm')

  await expect(rows(page)).toHaveCount(1)
  await expect(page.locator('.test-input-criteria')).toHaveValue('')
  await expect(tab(page, de.contributions.confirms)).toHaveAttribute('aria-selected', 'true')
  const listed = listQuestions(graphql).filter((sent) => sent.paginated)
  expect(listed).toEqual([
    question(['CONFIRMED'], { query: 'gone', hideResubmission: false }),
    question(['CONFIRMED'], { hideResubmission: false }),
  ])
})

test('filters by group from the first page', async ({ page, graphql }) => {
  await open(page)
  await page.locator('.pagination').getByText('3', { exact: true }).click()
  await expect.poll(() => listQuestions(graphql).length).toBe(2)

  await groupFilter(page).locator('.dropdown-toggle').click()
  await expect(groupFilter(page).locator('.dropdown-item')).toHaveText([
    de.creationGroupFilter.all,
    de.creationGroupFilter.grouped,
    de.creationGroupFilter.untagged,
    'Garten',
    '#kueche',
  ])
  await groupFilter(page).locator('.dropdown-item', { hasText: 'Garten' }).click()

  await expect
    .poll(() => listQuestions(graphql).at(-1))
    .toEqual(question(OPEN, { creationGroup: 'garten' }))
  await expect(groupFilter(page).locator('.dropdown-toggle')).toHaveText('Garten')
})

test('offers a scoped moderator only the groups they look after', async ({ page, graphql }) => {
  const scoped = {
    ...moderator,
    role: 'MODERATOR',
    seesAllCreationGroups: false,
    visibleCreationGroups: ['kueche'],
    seesUntagged: false,
  }
  graphql.answer(signedInAnswers(scoped))
  await signIn(page, '/creation-confirm', scoped)
  await expect(rows(page)).toHaveCount(4)

  expect(listQuestions(graphql)).toEqual([question(OPEN, { creationGroup: '*grouped' })])
  await groupFilter(page).locator('.dropdown-toggle').click()
  await expect(groupFilter(page).locator('.dropdown-item')).toHaveText([
    de.creationGroupFilter.grouped,
    '#kueche',
  ])
  // a moderator without the right to ask Crea sees no column for it
  await expect(page.getByRole('columnheader', { name: de.crea.column })).toHaveCount(0)
})

for (const [decision, button, mutation, toast] of [
  ['confirm', de.save, 'confirmContribution', de.creation_form.toasted_created],
  ['deny', de.deny, 'denyContribution', de.creation_form.toasted_denied],
  ['delete', de.delete, 'adminDeleteContribution', de.creation_form.toasted_delete],
] as const) {
  test(`asks once more, then sends the decision ${decision}`, async ({ page, graphql }) => {
    graphql.answer({ [mutation]: true })
    await open(page)

    await row(page, 0).getByRole('button', { name: button, exact: true }).click()
    await expect(dialog(page).locator('.modal-title')).toHaveText(de.overlay[decision].title)
    await expect(dialog(page).locator('.modal-body .row')).toHaveText([
      'Betrag100 GDD',
      'Schöpfung für MonatOktober 2026',
      'NachrichtMemo of contribution 1',
      'NameFirst1 Last1',
      'E-Mailmember1@example.org',
    ])
    await expect(dialog(page).locator('.modal-body p')).toHaveText([
      de.overlay[decision].text,
      de.overlay[decision].question,
    ])
    await dialog(page).getByRole('button', { name: de.overlay[decision].yes }).click()

    await expect(rows(page)).toHaveCount(3)
    await expect(dialog(page)).toHaveCount(0)
    await expect(page.getByRole('alert')).toContainText(toast)
    await expect(page.locator('.tab-badge')).toHaveText('59')
    expect(graphql.sentFor(mutation).map((sent) => sent.variables)).toEqual([{ id: 1 }])
    expect(listQuestions(graphql)).toHaveLength(1)
  })
}

test('keeps a contribution whose decision is refused', async ({ page, graphql }) => {
  graphql.answer({ confirmContribution: new Failure('Contribution already confirmed') })
  await open(page)

  await row(page, 1).getByRole('button', { name: de.save, exact: true }).click()
  await dialog(page).getByRole('button', { name: de.overlay.confirm.yes }).click()

  await expect(page.getByRole('alert')).toContainText('Contribution already confirmed')
  await expect(dialog(page)).toHaveCount(0)
  await expect(rows(page)).toHaveCount(4)
  await expect(page.locator('.tab-badge')).toHaveText('60')
})

test('sends a decision once, however often it is pressed', async ({ page, graphql }) => {
  graphql.answer({ denyContribution: true })
  await open(page)

  await row(page, 0).getByRole('button', { name: de.deny, exact: true }).click()
  await dialog(page).getByRole('button', { name: de.overlay.deny.yes }).dblclick()

  await expect(rows(page)).toHaveCount(3)
  expect(graphql.sentFor('denyContribution')).toHaveLength(1)
  await expect(page.locator('.tab-badge')).toHaveText('59')
})

test('sends nothing where the decision is called off', async ({ page, graphql }) => {
  await open(page)

  await row(page, 0).getByRole('button', { name: de.delete, exact: true }).click()
  await dialog(page).getByRole('button', { name: de.overlay.cancel }).click()
  await expect(dialog(page)).toHaveCount(0)
  await row(page, 0).getByRole('button', { name: de.deny, exact: true }).click()
  await dialog(page).getByRole('button', { name: 'Close' }).click()
  await expect(dialog(page)).toHaveCount(0)

  expect(graphql.sentFor('adminDeleteContribution')).toEqual([])
  expect(graphql.sentFor('denyContribution')).toEqual([])
  await expect(rows(page)).toHaveCount(4)
})

// a question opened from the first row's "Löschen", once it has the keyboard
const askToDelete = async (page: Page) => {
  await open(page)
  const opener = row(page, 0).getByRole('button', { name: de.delete, exact: true })
  await opener.click()
  await expect(dialog(page)).toBeVisible()
  // the window takes the keyboard as it opens
  await expect.poll(() => keyboardInDialog(page)).toBe(true)
  return opener
}
const keyboardInDialog = (page: Page) =>
  page.evaluate(() => !!document.activeElement?.closest('.modal'))

test('keeps the keyboard in the question', async ({ page }) => {
  await askToDelete(page)

  // back from the window itself, then round and round inside: the ×, yes, cancel
  for (const key of ['Shift+Tab', 'Tab', 'Tab', 'Tab', 'Tab', 'Shift+Tab', 'Shift+Tab']) {
    await page.keyboard.press(key)
    expect(await keyboardInDialog(page), key).toBe(true)
  }
})

test('gives the keyboard back to the button that asked', async ({ page }, info) => {
  test.skip(info.project.name === 'old', 'the old admin gives it back only now and then')
  const opener = await askToDelete(page)

  await dialog(page).getByRole('button', { name: 'Close' }).click()

  await expect(dialog(page)).toHaveCount(0)
  await expect(opener).toBeFocused()
})

test('closes the question on Escape', async ({ page, graphql }, info) => {
  test.skip(info.project.name === 'old', 'the old dialog does not take the focus, nor Escape')
  await open(page)

  await row(page, 0).getByRole('button', { name: de.deny, exact: true }).click()
  await expect(dialog(page)).toBeVisible()
  await page.keyboard.press('Escape')

  await expect(dialog(page)).toHaveCount(0)
  expect(graphql.sentFor('denyContribution')).toEqual([])
})

const pickGroup = async (page: Page, index: number, group: string) => {
  await row(page, index).locator('.group-select .dropdown-toggle').click()
  await row(page, index).locator('.group-select .dropdown-item', { hasText: group }).click()
}

test('moves a contribution to another group once asked', async ({ page, graphql }) => {
  graphql.answer({ assignContributionCreationGroups: true })
  await open(page)

  await pickGroup(page, 1, '#kueche')
  await expect(dialog(page).locator('.modal-title')).toHaveText(de.contribution.changeGroup)
  await expect(dialog(page).locator('.modal-body p').first()).toHaveText(
    'Diesen Beitrag von Garten nach #kueche verschieben?',
  )
  await dialog(page).getByRole('button', { name: de.contribution.changeGroupConfirm }).click()

  await expect(page.getByRole('alert')).toContainText(de.contribution.changeGroupDone)
  expect(graphql.sentFor('assignContributionCreationGroups').map((sent) => sent.variables)).toEqual(
    [{ contributionId: 2, tags: ['kueche'] }],
  )
  // the list anew: whether the contribution is still in it is the server's to say
  await expect.poll(() => listQuestions(graphql)).toEqual([question(OPEN), question(OPEN)])
})

test('puts the group back where the move is called off or refused', async ({ page, graphql }) => {
  graphql.answer({ assignContributionCreationGroups: new Failure('Contribution is closed') })
  await open(page)
  const shown = row(page, 0).locator('.group-select .dropdown-toggle')

  await pickGroup(page, 0, 'Garten')
  await expect(shown).toHaveText('Garten')
  await dialog(page).getByRole('button', { name: de.overlay.cancel }).click()
  await expect(shown).toHaveText(de.contribution.noGroup)
  expect(graphql.sentFor('assignContributionCreationGroups')).toEqual([])

  await pickGroup(page, 0, 'Garten')
  await dialog(page).getByRole('button', { name: de.contribution.changeGroupConfirm }).click()
  await expect(page.getByRole('alert')).toContainText('Contribution is closed')
  await expect(shown).toHaveText(de.contribution.noGroup)
  expect(listQuestions(graphql)).toHaveLength(1)
})

test('copies a selected text without its hashtags', async ({ page }) => {
  await open(page)

  const copied = await page.evaluate(() => {
    const cell = document.createElement('p')
    cell.textContent = 'Garden work #garten today'
    document.querySelector('.creation-confirm')?.append(cell)
    getSelection()?.selectAllChildren(cell)
    const event = new ClipboardEvent('copy', {
      clipboardData: new DataTransfer(),
      bubbles: true,
      cancelable: true,
    })
    cell.dispatchEvent(event)
    return event.clipboardData?.getData('text/plain')
  })

  expect(copied).toBe('Garden work  today')
})

test.describe('on a phone', () => {
  test.use({ viewport: { width: 390, height: 1200 } })

  test('shows each contribution as a card with its buttons', async ({ page }) => {
    await open(page)

    const card = row(page, 0)
    await expect(card.locator('td')).toHaveCount(3)
    await expect(card.locator('.phone-head')).toContainText('First1 Last1')
    await expect(card.locator('.phone-head')).toContainText('100 GDD')
    await expect(card.locator('td').nth(1)).toHaveText('Memo of contribution 1')
    await expect(card.locator('.phone-actions button')).toHaveCount(5)
    expect(
      await card
        .locator('.phone-actions button')
        .evaluateAll((buttons) => buttons.map((button) => button.getAttribute('title'))),
    ).toEqual([de.delete, de.deny, de.crea.column, de.details, de.contribution.confirm])
    // the moderator's own: no decision, and no details while it is open
    await expect(row(page, 3).locator('.phone-actions button')).toHaveCount(0)
  })

  test('offers no Crea on a card to a moderator without the right', async ({ page, graphql }) => {
    const plain = { ...moderator, role: 'MODERATOR' }
    graphql.answer(signedInAnswers(plain))
    await signIn(page, '/creation-confirm', plain)
    await expect(rows(page)).toHaveCount(4)

    await expect(row(page, 0).locator('.phone-actions button')).toHaveCount(4)
    await expect(row(page, 0).getByTitle(de.crea.column)).toHaveCount(0)
  })
})

test('starts over at the first page as the box is unticked', async ({ page, graphql }, info) => {
  test.skip(info.project.name === 'old', 'the old admin asks for the page it stood on')
  await open(page)
  await page.locator('.pagination').getByText('3', { exact: true }).click()
  await expect.poll(() => listQuestions(graphql).length).toBe(2)

  await page.locator('#hide-resubmission').uncheck()

  await expect
    .poll(() => listQuestions(graphql).at(-1))
    .toEqual(question(OPEN, { hideResubmission: false }))
})
