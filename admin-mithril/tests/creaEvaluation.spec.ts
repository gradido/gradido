// AI-GENERATED — not an architecture reference
import type { Page } from '@playwright/test'
import de from '../../admin/src/locales/de.json' with { type: 'json' }
import { resumedChat } from './fixtures/aiChat'
import {
  contributionList,
  creaEvaluation,
  groups,
  listedContribution,
} from './fixtures/contributions'
import { type Answer, expect, Failure, test } from './fixtures/graphql'
import { signedInAnswers, signIn } from './fixtures/signIn'

type Variables = Record<string, unknown>
type Listed = ReturnType<typeof listedContribution>

const REMARK = {
  remark: 'Knows the garden',
  updatedAt: '2026-10-20T10:00:00.000Z',
  updatedByName: 'Peter',
}

// The list of the page, and the member's open contributions the window asks for by member.
const answersFor = (list: Listed[], more: Record<string, Answer> = {}): Record<string, Answer> => ({
  ...signedInAnswers(),
  ...resumedChat,
  adminListContributions: (variables: { filter: { userId?: number } }) =>
    contributionList(
      variables.filter.userId ? list.filter((c) => c.userId === variables.filter.userId) : list,
    ),
  creationGroups: groups,
  adminOpenCreations: [],
  userRemark: null,
  creaEvaluateContribution: creaEvaluation(),
  ...more,
})

test.use({ timezoneId: 'Europe/Berlin' })

test.beforeEach(async ({ graphql }) => {
  graphql.answer(answersFor([listedContribution(1), listedContribution(2)]))
})

const dialog = (page: Page) => page.getByRole('dialog')
const draft = (page: Page) =>
  dialog(page).locator(`p:has(strong:text-is("${de.crea.response}")) + textarea`)
const readsRemark = (page: Page) => dialog(page).getByLabel(de.crea.readsRemark)
const signature = (page: Page) => dialog(page).getByPlaceholder('z. B. Herzliche Grüße, Bernd 😊')
const salutation = (page: Page) => dialog(page).locator('#crea-salutation')
const asked = (
  graphql: { sentFor: (field: string) => { variables: Variables }[] },
  field: string,
) => graphql.sentFor(field).map((sent) => sent.variables)
const stored = (page: Page, key: string) => page.evaluate((key) => localStorage.getItem(key), key)
const openCrea = async (page: Page, index = 0) => {
  await signIn(page, '/creation-confirm')
  await page
    .locator('.open-creations-table > table > tbody > tr')
    .nth(index)
    .getByTitle(de.crea.column)
    .click()
  await expect(dialog(page)).toBeVisible()
}
const input = (more: Variables = {}) => ({
  text: 'Memo of contribution 1',
  enteredGdd: 100,
  contributionRef: '1',
  recipientFirstName: 'First1',
  salutation: null,
  personPseudonym: '1',
  userId: null,
  date: '2026-10-01T00:00:00.000Z',
  uiLanguage: 'de',
  ...more,
})

test('judges a contribution as it opens, and drafts a reply', async ({ page, graphql }) => {
  await openCrea(page)

  await expect(dialog(page).locator('.badge')).toHaveText('Bestätigen empfohlen')
  expect(asked(graphql, 'userRemark')).toEqual([{ userId: 1 }])
  expect(asked(graphql, 'adminListContributions').at(-1)).toEqual({
    filter: { statusFilter: ['IN_PROGRESS', 'PENDING'], userId: 1 },
    paginated: { currentPage: 1, pageSize: 50, order: 'DESC' },
  })
  expect(asked(graphql, 'creaEvaluateContribution')).toEqual([{ input: input() }])
  await expect(dialog(page).locator('.modal-title')).toHaveText('Creas Einschätzung')
  await expect(dialog(page).locator('.border.rounded').first()).toContainText(
    /First1 Last1\s*\(seit \d+ Monaten\)/,
  )
  await expect(dialog(page).locator('.border.rounded .text-muted.small')).toHaveText(
    '5 Std · 100 GDD · 1.10.2026',
  )
  await expect(dialog(page).locator('li')).toHaveText([
    de.crea.flags_map.anrede_unsicher,
    /^How many beds\?\s*\(one \/ two\)\s*$/,
  ])
  await expect(salutation(page)).toHaveAttribute('placeholder', 'Hallo First1')
  // the salutation filled in, the signature waits for one
  await expect(draft(page)).toHaveValue('Hallo First1,\n\nthank you for your work.\n\n[SIGNATUR]')
  // held for the form of the contribution, with the model that wrote it
  expect(await stored(page, 'crea.lastResponse')).toBe(
    'Hallo First1,\n\nthank you for your work.\n\n[SIGNATUR]',
  )
  expect(await stored(page, 'crea.lastResponseModel')).toBe('claude-x')

  await dialog(page).getByRole('button', { name: de.crea.close }).click()
  await expect(dialog(page)).toHaveCount(0)
})

test('fills in the signature and the salutation as they are typed', async ({ page }) => {
  await openCrea(page)

  await signature(page).fill('Peter from Gradido')
  await salutation(page).fill('Liebe First1')

  await expect(draft(page)).toHaveValue(
    'Liebe First1,\n\nthank you for your work.\n\nPeter from Gradido',
  )
  expect(await stored(page, 'crea.moderatorSignature')).toBe('Peter from Gradido')
  expect(await stored(page, 'crea.lastResponse')).toBe(
    'Liebe First1,\n\nthank you for your work.\n\nPeter from Gradido',
  )

  // edited by hand, the draft stays as it is
  await draft(page).fill('My own words')
  await salutation(page).fill('Hi First1')
  await expect(draft(page)).toHaveValue('My own words')
})

test('keeps the signature on this device', async ({ page }) => {
  await page.addInitScript(() => localStorage.setItem('crea.moderatorSignature', 'Yours, Peter'))
  await openCrea(page)

  await expect(signature(page)).toHaveValue('Yours, Peter')
  await expect(draft(page)).toHaveValue('Hallo First1,\n\nthank you for your work.\n\nYours, Peter')
})

test('stores the salutation of the member, and judges with it from then on', async ({
  page,
  graphql,
}) => {
  graphql.answer({ setCreaSalutation: true })
  await openCrea(page)

  await salutation(page).fill('Liebe First1')
  await dialog(page).getByRole('button', { name: de.crea.salutationSave }).click()

  await expect(page.getByRole('alert')).toContainText(de.crea.salutationSaved)
  expect(asked(graphql, 'setCreaSalutation')).toEqual([{ userId: 1, salutation: 'Liebe First1' }])
  // answered: the question of the salutation goes, and so does the button
  await expect(dialog(page).getByText(de.crea.flags_map.anrede_unsicher)).toHaveCount(0)
  await expect(dialog(page).getByRole('button', { name: de.crea.salutationSave })).toHaveCount(0)

  await dialog(page).getByRole('button', { name: de.crea.close }).click()
  await page
    .locator('.open-creations-table > table > tbody > tr')
    .first()
    .getByTitle(de.crea.column)
    .click()
  await expect(dialog(page).locator('.badge')).toBeVisible()
  expect(asked(graphql, 'creaEvaluateContribution').at(-1)).toEqual({
    input: input({ salutation: 'Liebe First1' }),
  })
  await expect(salutation(page)).toHaveValue('Liebe First1')
})

test("judges with the salutation the member's record holds now, not the list's", async ({
  page,
  graphql,
}) => {
  // the list behind the window predates a salutation stored since; the window reads it anew
  graphql.answer({
    adminListContributions: (variables: { filter: { userId?: number } }) =>
      variables.filter.userId
        ? contributionList([
            listedContribution(1, 1, {
              user: { ...listedContribution(1).user, salutation: 'Liebe First1' },
            }),
          ])
        : contributionList([listedContribution(1), listedContribution(2)]),
  })
  await openCrea(page)

  await expect(dialog(page).locator('.badge')).toBeVisible()
  expect(asked(graphql, 'creaEvaluateContribution')).toEqual([
    { input: input({ salutation: 'Liebe First1' }) },
  ])
  await expect(salutation(page)).toHaveValue('Liebe First1')
})

test('says where the salutation could not be stored', async ({ page, graphql }) => {
  graphql.answer({ setCreaSalutation: new Failure('SALUTATION_TOO_LONG') })
  await openCrea(page)

  await salutation(page).fill('Liebe First1')
  await dialog(page).getByRole('button', { name: de.crea.salutationSave }).click()

  await expect(page.getByRole('alert')).toContainText(de.crea.salutationSaveFailed)
  await expect(dialog(page).getByRole('button', { name: de.crea.salutationSave })).toBeVisible()
})

test("writes anew for a decision of the moderator's own", async ({ page, graphql }) => {
  graphql.answer({
    creaEvaluateContribution: creaEvaluation({ overallVerdict: 'inquire', flags: [] }),
    creaRewriteResponse: {
      responseText: '[ANREDE], confirmed.\n[SIGNATUR]',
      memoSupplement: 'Hours checked',
      model: 'claude-y',
    },
  })
  await openCrea(page)
  await expect(dialog(page).locator('.badge')).toHaveText('Rückfrage empfohlen')
  await expect(dialog(page).getByRole('button', { name: de.crea.rewrite })).toHaveCount(0)

  await dialog(page).getByRole('button', { name: de.crea.decision.confirm }).click()
  await dialog(page).getByPlaceholder(de.crea.contextPlaceholder).fill('I know her')
  await dialog(page).getByRole('button', { name: de.crea.rewrite }).click()

  await expect(draft(page)).toHaveValue('Hallo First1, confirmed.\n[SIGNATUR]')
  expect(asked(graphql, 'creaRewriteResponse')).toEqual([
    { input: input({ moderatorDecision: 'confirm', moderatorContext: 'I know her' }) },
  ])
  // the public note for the contribution's text, held for its form
  await expect(dialog(page).getByText(de.crea.supplement, { exact: true })).toBeVisible()
  expect(await stored(page, 'crea.lastSupplement')).toBe('Hours checked')
  expect(await stored(page, 'crea.lastResponseModel')).toBe('claude-y')
  // the assessment stays as it was
  await expect(dialog(page).locator('.badge')).toHaveText('Rückfrage empfohlen')
})

test('says calmly where Crea is not switched on', async ({ page, graphql }) => {
  graphql.answer({ creaEvaluateContribution: new Failure('Anthropic API is not enabled') })
  await openCrea(page)

  await expect(dialog(page).locator('.alert-info')).toHaveText(de.crea.inactive)
  await expect(dialog(page).getByRole('button', { name: de.crea.evaluate })).toHaveCount(0)
})

test('offers to judge again where Crea failed', async ({ page, graphql }) => {
  let refuse = true
  graphql.answer({
    creaEvaluateContribution: () => (refuse ? new Failure('Overloaded') : creaEvaluation()),
  })
  await openCrea(page)

  await expect(dialog(page).locator('.alert-danger')).toHaveText('Overloaded')
  refuse = false
  await dialog(page).getByTestId('crea-evaluate-single').click()

  await expect(dialog(page).locator('.badge')).toHaveText('Bestätigen empfohlen')
  expect(graphql.sentFor('creaEvaluateContribution')).toHaveLength(2)
})

test.describe('with a remark on the member', () => {
  test.beforeEach(async ({ graphql }) => {
    graphql.answer({ userRemark: REMARK })
  })

  test('waits for the moderator, who decides whether Crea reads it', async ({ page, graphql }) => {
    await openCrea(page)

    await expect(page.getByTestId('member-remark')).toHaveText('Bemerkung: Knows the garden')
    await expect(page.getByTestId('crea-reads-remark-hint')).toHaveText(de.crea.readsRemarkHint)
    expect(graphql.sentFor('creaEvaluateContribution')).toEqual([])

    await readsRemark(page).check()
    await dialog(page).getByTestId('crea-evaluate-single').click()

    await expect(dialog(page).locator('.badge')).toBeVisible()
    expect(asked(graphql, 'creaEvaluateContribution')).toEqual([{ input: input({ userId: 1 }) }])
    // judged as Crea reads it now: nothing to judge again
    await expect(dialog(page).getByTestId('crea-evaluate-single')).toHaveCount(0)
    // the button pressed is gone: the keyboard stays in the window, at its first place
    await expect(dialog(page).getByRole('button', { name: 'Close' })).toBeFocused()
    await readsRemark(page).uncheck()
    await expect(dialog(page).getByTestId('crea-evaluate-single')).toBeVisible()
  })

  test('saves the remark before Crea reads it', async ({ page, graphql }) => {
    graphql.answer({
      setUserRemark: (variables: Variables) => ({ ...REMARK, remark: variables.remark }),
    })
    await openCrea(page)

    await page.getByTestId('member-remark-toggle').click()
    await page.getByTestId('member-remark-field').fill('Knows the garden well')
    await readsRemark(page).check()
    await dialog(page).getByTestId('crea-evaluate-single').click()

    await expect(dialog(page).locator('.badge')).toBeVisible()
    expect(asked(graphql, 'setUserRemark')).toEqual([
      { userId: 1, remark: 'Knows the garden well' },
    ])
    expect(
      graphql
        .sent()
        .map((sent) => sent.field)
        .slice(-2),
    ).toEqual(['setUserRemark', 'creaEvaluateContribution'])
  })
})

test.describe('with several open contributions of the member', () => {
  const later = '2099-01-01T00:00:00.000Z'
  const due = '2026-01-01T00:00:00.000Z'

  test.beforeEach(async ({ graphql }) => {
    graphql.answer(
      answersFor(
        [
          listedContribution(1),
          listedContribution(2, 1, { amount: '40', memo: 'Second' }),
          listedContribution(3, 1, { resubmissionAt: due, memo: 'Due' }),
          listedContribution(4, 1, { resubmissionAt: later, memo: 'Later' }),
        ],
        {
          creaEvaluateBatch: { ...creaEvaluation(), flags: [] },
          creaRewriteBatch: {
            responseText: 'Batch reply',
            memoSupplement: null,
            model: 'claude-z',
          },
        },
      ),
    )
  })

  test('lets the moderator choose which Crea judges together', async ({ page, graphql }) => {
    await openCrea(page, 3)

    const picks = dialog(page).getByRole('checkbox')
    await expect(picks).toHaveCount(4)
    // never put off, and the one asked for, are ticked; what waits for a resubmission is not
    await expect(dialog(page).locator('.crea-section-heading')).toHaveText([
      de.crea.resubmissionDue,
      de.crea.resubmission,
    ])
    expect(
      await picks.evaluateAll((boxes) => boxes.map((box) => (box as HTMLInputElement).checked)),
    ).toEqual([true, true, false, true])
    expect(graphql.sentFor('creaEvaluateBatch')).toEqual([])

    await dialog(page).getByRole('button', { name: de.crea.deselectAll }).click()
    await expect(dialog(page).getByTestId('crea-evaluate-batch')).toBeDisabled()
    await dialog(page).getByRole('button', { name: de.crea.selectAll }).click()
    // drawn before a box is unticked, or the tick of all would come after it
    await expect(picks.nth(3)).toBeChecked()
    await picks.nth(3).uncheck()
    await picks.nth(2).uncheck()
    await dialog(page).getByTestId('crea-evaluate-batch').click()

    await expect(dialog(page).locator('.badge')).toHaveText('Bestätigen empfohlen')
    expect(asked(graphql, 'creaEvaluateBatch')).toEqual([
      {
        input: {
          contributions: [
            { text: 'Memo of contribution 1', enteredGdd: 100, date: '2026-10-01T00:00:00.000Z' },
            { text: 'Second', enteredGdd: 40, date: '2026-10-01T00:00:00.000Z' },
          ],
          recipientFirstName: 'First1',
          salutation: null,
          uiLanguage: 'de',
          userId: null,
        },
      },
    ])

    await dialog(page).getByRole('button', { name: de.crea.decision.deny }).click()
    await dialog(page).getByRole('button', { name: de.crea.rewrite }).click()
    await expect(draft(page)).toHaveValue('Batch reply')
    expect(asked(graphql, 'creaRewriteBatch')).toEqual([
      {
        input: {
          ...(asked(graphql, 'creaEvaluateBatch')[0].input as Variables),
          moderatorDecision: 'deny',
          moderatorContext: null,
        },
      },
    ])
  })
})
