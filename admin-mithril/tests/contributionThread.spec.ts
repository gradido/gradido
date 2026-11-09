// AI-GENERATED — not an architecture reference
import type { Page } from '@playwright/test'
import de from '../../admin/src/locales/de.json' with { type: 'json' }
import { resumedChat } from './fixtures/aiChat'
import {
  contributionList,
  groups,
  listedContribution,
  moderatorMessage,
  threadAnswers,
  threadMessage,
} from './fixtures/contributions'
import { type Answer, expect, Failure, test } from './fixtures/graphql'
import { moderator, signedInAnswers, signIn } from './fixtures/signIn'

// a resubmission of contribution 1: 15:30 where the browser sits (Europe/Berlin)
const RESUBMISSION = '2026-12-01T14:30:00.000Z'
const COLLEAGUE = '11111111-0000-4000-8000-000000000001'
const REMARK = {
  remark: 'Line one\nline two',
  updatedAt: '2026-10-20T10:00:00.000Z',
  updatedByName: 'Peter',
}

const createdMessage = {
  id: 9,
  message: 'x',
  createdAt: '2026-10-06T09:00:00.000Z',
  updatedAt: null,
  type: 'DIALOG',
  userAlias: 'peter',
}
const updated = { amount: '100', date: '2026-10-01T00:00:00.000Z', memo: 'x' }

const answersFor = (
  list: ReturnType<typeof listedContribution>[],
  thread = threadAnswers([threadMessage(1)], REMARK),
): Record<string, Answer> => ({
  ...signedInAnswers(),
  ...resumedChat,
  adminListContributions: contributionList(list),
  creationGroups: groups,
  adminOpenCreations: [],
  contactRefs: [],
  ...thread,
})

test.use({ timezoneId: 'Europe/Berlin' })

test.beforeEach(async ({ graphql }) => {
  graphql.answer(
    answersFor([listedContribution(1, 1, { resubmissionAt: RESUBMISSION }), listedContribution(2)]),
  )
})

const rows = (page: Page) =>
  page.locator('.open-creations-table > table > tbody > tr[class^="table-"]')
const details = (page: Page, index: number) =>
  rows(page)
    .nth(index)
    .getByRole('button', { name: /^Details/ })
const card = (page: Page) => page.locator('.row-details-card')
const form = (page: Page) => page.locator('.contribution-messages-formular')
const field = (page: Page) => form(page).locator('.tab-pane.active textarea')
const box = (page: Page) => form(page).locator('input[type=checkbox]')
const time = (page: Page) => form(page).locator('input[placeholder="hh:mm"]')
const save = (page: Page) => page.getByTestId('submit-dialog')
const formTab = (page: Page, name: string) => form(page).getByRole('tab', { name })
const asked = (graphql: { sentFor: (field: string) => { variables: object }[] }, field: string) =>
  graphql.sentFor(field).map((sent) => sent.variables)
// the resubmission as the old admin sends it: Date.prototype.toString, where the browser sits
const asSent = (page: Page, iso: string) => page.evaluate((at) => new Date(at).toString(), iso)
const openRow = async (page: Page, index = 0) => {
  await signIn(page, '/creation-confirm')
  await details(page, index).click()
  await expect(form(page)).toBeVisible()
}

test('opens a contribution with its member, the remark and the thread', async ({
  page,
  graphql,
}) => {
  graphql.answer(
    threadAnswers(
      [
        threadMessage(1, { message: 'Hello **bold** see https://gradido.net/x ok' }),
        moderatorMessage(2, { message: 'Question?' }),
        moderatorMessage(3, { type: 'MODERATOR', message: 'A note' }),
        threadMessage(4, {
          type: 'HISTORY',
          message:
            'Thu Oct 01 2026 00:00:00 GMT+0000 (Coordinated Universal Time)\n---\nold memo\n---\n50.5',
        }),
      ],
      REMARK,
    ),
  )
  await openRow(page)

  // one question for the thread and the remark
  expect(asked(graphql, 'adminListContributionMessages')).toEqual([
    { contributionId: 1, userId: 1, pageSize: 25, currentPage: 1, order: 'ASC' },
  ])
  await expect(details(page, 0)).toHaveAttribute('title', de.hide_details)
  await expect(details(page, 0)).toHaveAttribute('aria-expanded', 'true')
  const member = card(page).locator('.list-group-item').first()
  await expect(member.getByRole('link', { name: 'First1 Last1' })).toHaveAttribute(
    'href',
    '/admin/user?search=member1@example.org',
  )
  await expect(member.getByRole('link', { name: 'member1@example.org' })).toHaveAttribute(
    'href',
    'mailto:member1@example.org',
  )
  await expect(page.getByTestId('member-remark')).toHaveText('Bemerkung: Line one\nline two')
  await expect(card(page).locator('.list-group-item').nth(2)).toHaveText(
    /^Registriert: \S+2026, Angelegt: \S+2026$/,
  )

  const bubbles = card(page).locator('.message-bubble')
  await expect(bubbles).toHaveCount(4)
  await expect(bubbles.nth(0)).toHaveClass(/is-user/)
  await expect(bubbles.nth(0).getByTestId('user-name')).toHaveText('member1')
  await expect(bubbles.nth(0).getByTestId('user-date')).toHaveText('6.10.2026')
  await expect(bubbles.nth(0).locator('strong')).toHaveText('bold')
  await expect(bubbles.nth(0).getByRole('link')).toHaveAttribute('href', 'https://gradido.net/x')
  await expect(bubbles.nth(0).getByTestId('user-message')).toHaveText(
    'Hello bold see https://gradido.net/x ok',
  )
  await expect(bubbles.nth(1)).toHaveClass(/is-moderator/)
  await expect(bubbles.nth(1).getByTestId('moderator-label')).toHaveText(de.moderator.moderator)
  await expect(bubbles.nth(1).getByTestId('moderator-name')).toHaveText('peter')
  await expect(bubbles.nth(2)).toHaveClass(/is-note/)
  await expect(bubbles.nth(2).getByTestId('message-kind')).toHaveText(
    `${de.moderator.notice} – ${de.moderator['notice-tooltip']}`,
  )
  await expect(bubbles.nth(3)).toHaveClass(/is-change/)
  await expect(bubbles.nth(3).getByTestId('history-label')).toHaveText(de.moderator.history)
  await expect(bubbles.nth(3).getByTestId('user-message')).toHaveText(
    /^1\.10\.2026\s*old memo\s*50,50 GDD$/,
  )

  // the resubmission it holds, to change or to keep
  await expect(box(page)).toBeChecked()
  await expect(time(page)).toHaveValue('15:30')
  // each with what it is for, as a tooltip
  await expect(form(page).getByRole('tab')).toHaveText([
    new RegExp(`^${de.moderator.message}`),
    new RegExp(`^${de.moderator.notice}`),
    new RegExp(`^${de.moderator.memo}`),
  ])
  await expect(save(page)).toBeEnabled()

  await details(page, 0).click()
  await expect(card(page)).toHaveCount(0)
  await expect(details(page, 0)).toHaveAttribute('aria-expanded', 'false')
})

test('keeps one contribution open at a time', async ({ page, graphql }) => {
  await openRow(page)

  await details(page, 1).click()

  await expect(card(page)).toHaveCount(1)
  await expect(details(page, 1)).toHaveAttribute('aria-expanded', 'true')
  expect(graphql.sentFor('adminListContributionMessages')).toHaveLength(2)
})

test('shows a closed contribution without the form', async ({ page, graphql }) => {
  graphql.answer(answersFor([listedContribution(5, 5, { contributionStatus: 'CONFIRMED' })]))
  await signIn(page, '/creation-confirm')
  await details(page, 0).click()

  await expect(card(page).locator('.message-bubble')).toHaveCount(1)
  await expect(form(page)).toHaveCount(0)
})

test('reports a thread that cannot be read', async ({ page, graphql }) => {
  graphql.answer({ adminListContributionMessages: new Failure('Thread is gone') })
  await signIn(page, '/creation-confirm')
  await details(page, 0).click()

  await expect(page.getByRole('alert')).toContainText('Thread is gone')
})

test('writes to the member, and the list comes anew where the resubmission hides it', async ({
  page,
  graphql,
}) => {
  graphql.answer({ adminCreateContributionMessage: createdMessage })
  await openRow(page)

  await field(page).fill('Hi there')
  await save(page).click()

  await expect(page.getByRole('alert')).toContainText(de.message.request)
  expect(asked(graphql, 'adminCreateContributionMessage')).toEqual([
    {
      contributionId: 1,
      message: 'Hi there',
      messageType: 'DIALOG',
      resubmissionAt: await asSent(page, RESUBMISSION),
    },
  ])
  await expect.poll(() => graphql.sentFor('adminListContributions').length).toBe(2)
  await expect(card(page)).toHaveCount(0)
})

test('writes to the member and keeps the thread open, now as a question', async ({
  page,
  graphql,
}) => {
  graphql.answer({ adminCreateContributionMessage: createdMessage })
  await openRow(page, 1)

  await field(page).fill('a question')
  await save(page).click()

  await expect(page.getByRole('alert')).toContainText(de.message.request)
  expect(asked(graphql, 'adminCreateContributionMessage')).toEqual([
    { contributionId: 2, message: 'a question', messageType: 'DIALOG', resubmissionAt: null },
  ])
  // the thread anew, the list not
  await expect.poll(() => graphql.sentFor('adminListContributionMessages').length).toBe(2)
  expect(graphql.sentFor('adminListContributions')).toHaveLength(1)
  await expect(field(page)).toHaveValue('')
  await details(page, 1).click()
  await expect(details(page, 1)).toHaveAttribute(
    'title',
    `${de.details} – ${de.contribution.detailsState.question}`,
  )
})

test("takes a colleague's resubmission back with a note on their question", async ({
  page,
  graphql,
}) => {
  graphql.answer({
    ...answersFor(
      [
        listedContribution(1, 1, {
          resubmissionAt: RESUBMISSION,
          contributionStatus: 'IN_PROGRESS',
        }),
      ],
      threadAnswers([
        threadMessage(1),
        moderatorMessage(2, { userAlias: 'colleague', userGradidoID: COLLEAGUE, message: 'Why?' }),
      ]),
    ),
    adminCreateContributionMessage: { ...createdMessage, type: 'MODERATOR' },
  })
  await openRow(page)
  await expect(page.getByTestId('note-wakes-resubmission')).toHaveCount(0)

  await formTab(page, de.moderator.notice).click()
  await expect(page.getByTestId('note-wakes-resubmission')).toHaveText(
    'Deine Notiz nimmt die Wiedervorlage von colleague zurück.',
  )
  await field(page).fill('my note')
  await save(page).click()

  await expect(page.getByRole('alert')).toContainText(de.message.request)
  expect(asked(graphql, 'adminCreateContributionMessage')).toEqual([
    { contributionId: 1, message: 'my note', messageType: 'MODERATOR', resubmissionAt: null },
  ])
  await expect(box(page)).not.toBeChecked()
  await details(page, 0).click()
  await expect(details(page, 0)).toHaveAttribute(
    'title',
    `${de.details} – ${de.contribution.detailsState.note}`,
  )
  // opened again, the row holds no resubmission any more
  await details(page, 0).click()
  await expect(box(page)).not.toBeChecked()
})

test('changes the text of the contribution, and the list comes anew', async ({ page, graphql }) => {
  graphql.answer({ adminUpdateContribution: updated })
  await openRow(page, 1)

  await formTab(page, de.moderator.memo).click()
  await expect(field(page)).toHaveValue('Memo of contribution 2')
  await field(page).fill('Tiny')
  await expect(save(page)).toBeDisabled()
  await field(page).fill('x'.repeat(513))
  await expect(form(page).locator('.text-danger')).toHaveText(
    de.crea.memoTooLong.replace('{max}', '512'),
  )
  await expect(save(page)).toBeDisabled()
  await field(page).fill('A changed memo')
  await save(page).click()

  await expect(page.getByRole('alert')).toContainText(de.message.request)
  expect(asked(graphql, 'adminUpdateContribution')).toEqual([
    { id: 2, memo: 'A changed memo', resubmissionAt: null },
  ])
  await expect.poll(() => graphql.sentFor('adminListContributions').length).toBe(2)
  await expect(card(page)).toHaveCount(0)
})

test('sends nothing for a resubmission without a day', async ({ page, graphql }) => {
  await openRow(page, 1)

  await box(page).check()
  await field(page).fill('later')
  await save(page).click()

  await expect(page.getByRole('alert')).toContainText(
    de.contributionMessagesForm.resubmissionDateInPast,
  )
  expect(graphql.sentFor('adminCreateContributionMessage')).toEqual([])
})

test('saves no resubmission whose time is not whole', async ({ page, graphql }, info) => {
  test.skip(info.project.name === 'old', 'the old admin sends "Invalid Date" on Enter in the field')
  graphql.answer({ adminCreateContributionMessage: createdMessage })
  await openRow(page)
  await field(page).fill('Hi there')

  await time(page).fill('9')
  await expect(save(page)).toBeDisabled()
  await time(page).press('Enter')
  await expect(time(page)).toBeFocused()

  expect(graphql.sentFor('adminCreateContributionMessage')).toEqual([])
  await time(page).fill('09:30')
  await expect(save(page)).toBeEnabled()
})

test('takes a resubmission away without a message', async ({ page, graphql }) => {
  graphql.answer({ adminUpdateContribution: updated })
  await openRow(page)

  await box(page).uncheck()
  await save(page).click()

  await expect(page.getByRole('alert')).toContainText(de.message.request)
  expect(asked(graphql, 'adminUpdateContribution')).toEqual([{ id: 1, resubmissionAt: null }])
  // two members on the list: nothing is offered for the others
  await expect(page.getByRole('dialog')).toHaveCount(0)
  await expect.poll(() => graphql.sentFor('adminListContributionMessages').length).toBe(2)
})

test("offers to take a resubmission away from all of the member's contributions", async ({
  page,
  graphql,
}) => {
  graphql.answer({
    ...answersFor([
      listedContribution(1, 1, { resubmissionAt: RESUBMISSION }),
      listedContribution(2, 1, { resubmissionAt: RESUBMISSION }),
      listedContribution(3, 1, { resubmissionAt: RESUBMISSION }),
    ]),
    adminUpdateContribution: (variables: Record<string, unknown>) =>
      variables.id === 3 ? new Failure("The contribution wasn't changed at all") : updated,
  })
  await openRow(page)

  await box(page).uncheck()
  await save(page).click()

  const dialog = page.getByRole('dialog')
  await expect(dialog.locator('.modal-title')).toHaveText(de.bulkResubmission.titleRemove)
  await expect(dialog.locator('.modal-body')).toHaveText(
    de.bulkResubmission.questionRemove.replace('{name}', 'First1 Last1'),
  )
  await dialog.getByRole('button', { name: de.bulkResubmission.confirm }).click()

  // what holds no resubmission already is no failure
  await expect(
    page.getByRole('alert').filter({ hasText: de.bulkResubmission.successRemove }),
  ).toHaveCount(1)
  await expect(dialog).toHaveCount(0)
  expect(asked(graphql, 'adminUpdateContribution')).toEqual([
    { id: 1, resubmissionAt: null },
    { id: 2, resubmissionAt: null },
    { id: 3, resubmissionAt: null },
  ])
  await expect.poll(() => graphql.sentFor('adminListContributions').length).toBe(2)
})

test('says where a resubmission was saved unchanged', async ({ page, graphql }) => {
  graphql.answer({ adminUpdateContribution: new Failure("The contribution wasn't changed at all") })
  await openRow(page)

  await save(page).click()

  await expect(page.getByRole('alert')).toContainText(de.bulkResubmission.noChange)
  expect(asked(graphql, 'adminUpdateContribution')).toEqual([
    { id: 1, resubmissionAt: await asSent(page, RESUBMISSION) },
  ])
})

test('starts the form over on cancel', async ({ page }) => {
  await openRow(page)

  await field(page).fill('half a thought')
  await box(page).uncheck()
  await form(page).getByRole('button', { name: de.form.cancel }).click()

  await expect(field(page)).toHaveValue('')
  await expect(box(page)).toBeChecked()
  await expect(time(page)).toHaveValue('15:30')
})

test('sets a selection bold with Ctrl+B', async ({ page }) => {
  await openRow(page)

  await field(page).fill('make this bold')
  await field(page).evaluate((element: HTMLTextAreaElement) => element.setSelectionRange(5, 9))
  await field(page).press('Control+b')

  await expect(field(page)).toHaveValue('make **this** bold')
})

test.describe('the remark on the member', () => {
  test('is written after a pause and kept', async ({ page, graphql }) => {
    graphql.answer({
      setUserRemark: (variables: Record<string, unknown>) => ({
        remark: variables.remark,
        updatedAt: '2026-11-01T10:00:00.000Z',
        updatedByName: 'Peter',
      }),
    })
    await openRow(page)

    await page.getByTestId('member-remark-toggle').click()
    await expect(page.getByTestId('member-remark-field')).toBeFocused()
    await expect(page.getByTestId('member-remark-field')).toHaveValue('Line one\nline two')
    await page.getByTestId('member-remark-field').fill('new words')
    await expect(page.getByTestId('member-remark-status')).toHaveText(de.remark.saved)
    await expect(page.getByTestId('member-remark-last-changed')).toHaveText(
      /^Zuletzt: Peter, 1\.11\.2026, 11:00$/,
    )
    expect(asked(graphql, 'setUserRemark')).toEqual([{ userId: 1, remark: 'new words' }])

    await page.getByTestId('member-remark-done').click()
    await expect(page.getByTestId('member-remark')).toHaveText('Bemerkung: new words')
    await expect(page.getByTestId('member-remark-toggle')).toBeFocused()
    expect(graphql.sentFor('setUserRemark')).toHaveLength(1)
  })

  test('is taken away by words of whitespace alone', async ({ page, graphql }) => {
    graphql.answer({ setUserRemark: null })
    await openRow(page)

    await page.getByTestId('member-remark-toggle').click()
    await page.getByTestId('member-remark-field').fill('   ')

    await expect(page.getByTestId('member-remark-status')).toHaveText(de.remark.saved)
    await expect(page.getByTestId('member-remark-field')).toHaveValue('')
    expect(asked(graphql, 'setUserRemark')).toEqual([{ userId: 1, remark: '   ' }])
    await page.getByTestId('member-remark-done').click()
    await expect(page.getByTestId('member-remark')).toHaveCount(0)
  })

  test('says where it was not saved, and saves it again', async ({ page, graphql }) => {
    let refuse = true
    graphql.answer({
      setUserRemark: (variables: Record<string, unknown>) =>
        refuse
          ? new Failure('nope')
          : {
              remark: variables.remark,
              updatedAt: '2026-11-01T10:00:00.000Z',
              updatedByName: 'Peter',
            },
    })
    await openRow(page)

    await page.getByTestId('member-remark-toggle').click()
    await page.getByTestId('member-remark-field').fill('more')
    await expect(page.getByRole('alert')).toHaveText(`${de.remark.failed} ${de.remark.retry}`)
    refuse = false
    await page.getByTestId('member-remark-retry').click()

    await expect(page.getByTestId('member-remark-status')).toHaveText(de.remark.saved)
    expect(asked(graphql, 'setUserRemark')).toEqual([
      { userId: 1, remark: 'more' },
      { userId: 1, remark: 'more' },
    ])
  })

  test('tells of a failed save once the field is closed', async ({ page, graphql }) => {
    graphql.answer({ setUserRemark: new Failure('nope') })
    await openRow(page)

    await page.getByTestId('member-remark-toggle').click()
    await page.getByTestId('member-remark-field').fill('quick')
    await page.keyboard.press('Escape')

    await expect(page.getByRole('alert')).toContainText(
      de.remark.failedClosed.replace('{name}', 'member1'),
    )
    expect(asked(graphql, 'setUserRemark')).toEqual([{ userId: 1, remark: 'quick' }])
  })
})

test.describe('with a draft of Crea', () => {
  test.beforeEach(async ({ page }) => {
    await page.addInitScript(() => {
      localStorage.setItem('crea.lastResponse', 'Dear member, thanks.')
      localStorage.setItem('crea.lastResponseModel', 'claude-x')
      localStorage.setItem('crea.lastSupplement', 'checked twice')
    })
  })

  test('puts the draft into the message, and says whose words they are', async ({
    page,
    graphql,
  }) => {
    graphql.answer({ adminCreateContributionMessage: createdMessage })
    await openRow(page, 1)

    await page.getByTestId('crea-insert-draft').click()
    await expect(field(page)).toHaveValue('Dear member, thanks.')
    await save(page).click()

    await expect(page.getByRole('alert')).toContainText(de.message.request)
    expect(asked(graphql, 'adminCreateContributionMessage')).toEqual([
      {
        contributionId: 2,
        message: 'Dear member, thanks.',
        messageType: 'DIALOG',
        resubmissionAt: null,
        aiModel: 'claude-x',
      },
    ])
  })

  test("adds the note to the text, with the moderator's alias", async ({ page }) => {
    await openRow(page, 1)

    await page.getByTestId('crea-append-memo').click()

    await expect(formTab(page, de.moderator.memo)).toHaveAttribute('aria-selected', 'true')
    await expect(field(page)).toHaveValue(
      `Memo of contribution 2 – 💬 ${moderator.alias}: checked twice`,
    )
  })
})
