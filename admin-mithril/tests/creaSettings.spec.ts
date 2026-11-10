// AI-GENERATED — not an architecture reference
import type { Page } from '@playwright/test'
import de from '../../admin/src/locales/de.json' with { type: 'json' }
import { type Answer, expect, Failure, test } from './fixtures/graphql'
import { signedInAnswers, signIn } from './fixtures/signIn'
import { member, searchUsers } from './fixtures/users'

type Variables = Record<string, unknown>
const words = de.crea.settings

const signer = (more: Record<string, unknown> = {}) => ({
  userId: 7,
  firstName: 'Sig',
  lastName: 'Ner',
  alias: null,
  role: 'ADMIN',
  eligible: true,
  reason: 'OK',
  ...more,
})
const settings = (more: Record<string, unknown> = {}) => ({
  model: 'claude-opus-5',
  effort: 'high',
  defaultModel: 'claude-sonnet-5',
  fastMode: true,
  matchingKeyingActive: false,
  firstCreationSigner: signer(),
  ...more,
})
// members 1 to 4; only an administrator or a moderator may sign
const FOUND = [
  member(1, { role: 'ADMIN' }),
  member(2),
  member(3, { role: 'MODERATOR_AI' }),
  member(4, { role: 'MODERATOR', firstName: 'Other' }),
]

const answers = (more: Record<string, Answer> = {}): Record<string, Answer> => ({
  ...signedInAnswers(),
  creaSettings: settings(),
  searchUsers: ({ query }: Variables) =>
    searchUsers(
      FOUND.filter((found) => `${found.firstName} ${found.alias}`.includes(query as string)),
    ),
  ...more,
})

test.beforeEach(async ({ graphql }) => {
  graphql.answer(answers())
})

const form = (page: Page) => page.locator('.crea-settings')
const model = (page: Page) => page.getByRole('textbox', { name: words.model })
const preset = (page: Page) => form(page).locator('select').nth(0)
const effort = (page: Page) => form(page).locator('select').nth(1)
const fastMode = (page: Page) => page.getByRole('checkbox', { name: words.fastMode })
const keying = (page: Page) => page.getByRole('checkbox', { name: words.matchingKeying })
const saveModeration = (page: Page) => form(page).getByRole('button', { name: de.save }).first()
const testButton = (page: Page) => page.getByRole('button', { name: words.testModel })
const keyingWarning = (page: Page) => page.getByTestId('matching-keying-off')
const asked = (
  graphql: { sentFor: (field: string) => { variables: Variables }[] },
  field: string,
) => graphql.sentFor(field).map((sent) => sent.variables)
const open = async (page: Page) => {
  await signIn(page, '/creaSettings')
  await expect(model(page)).toHaveValue('claude-opus-5')
}

test('shows what the server holds', async ({ page }) => {
  await open(page)

  await expect(page.locator('.h2')).toHaveText(words.title)
  await expect(model(page)).toHaveAttribute('placeholder', 'Standard: claude-sonnet-5')
  await expect(form(page)).toContainText('Leer lassen = Standardmodell (claude-sonnet-5).')
  await expect(effort(page)).toHaveValue('high')
  await expect(fastMode(page)).toBeChecked()
  await expect(keying(page)).not.toBeChecked()
  await expect(keyingWarning(page)).toHaveText(words.matchingKeyingOff)
  await expect(page.getByTestId('first-creation-signer')).toHaveText(
    'Unterzeichner: Sig Ner (ADMIN)',
  )
  await expect(page.getByText(words.unavailable)).toHaveCount(0)
})

test('sends nothing before the settings are read', async ({ page, graphql }) => {
  graphql.answer({ creaSettings: new Failure('no database') })
  await signIn(page, '/creaSettings')

  await expect(page.getByRole('alert')).toContainText('no database')
  await expect(page.getByText(words.unavailable)).toBeVisible()
  for (const button of [
    saveModeration(page),
    testButton(page),
    page.getByTestId('signer-save'),
    page.getByTestId('signer-remove'),
    page.getByTestId('matching-keying-save'),
  ]) {
    await expect(button).toBeDisabled()
  }
  // nothing is known of the switch: no warning about it
  await expect(keyingWarning(page)).toHaveCount(0)
})

test.describe('the support of the moderation', () => {
  test('saves model, effort and fast mode, and shows what the server took', async ({
    page,
    graphql,
  }) => {
    graphql.answer({
      setCreaSettings: {
        model: null,
        effort: 'max',
        defaultModel: 'claude-sonnet-6',
        fastMode: false,
      },
    })
    await open(page)

    // a preset fills the field
    await preset(page).selectOption('claude-opus-4-8')
    await expect(model(page)).toHaveValue('claude-opus-4-8')
    await effort(page).selectOption('max')
    await fastMode(page).uncheck()
    await keying(page).check()
    await saveModeration(page).click()

    await expect(page.getByRole('alert')).toContainText(words.savedModeration)
    expect(asked(graphql, 'setCreaSettings')).toEqual([
      { input: { model: 'claude-opus-4-8', effort: 'max', fastMode: false } },
    ])
    await expect(model(page)).toHaveValue('')
    await expect(model(page)).toHaveAttribute('placeholder', 'Standard: claude-sonnet-6')
    // the switch is not saved with them, and keeps what it shows
    await expect(keying(page)).toBeChecked()
    expect(graphql.sentFor('setCreaMatchingKeying')).toEqual([])
  })

  test('sends an empty model as the default', async ({ page, graphql }) => {
    graphql.answer({
      setCreaSettings: {
        model: null,
        effort: 'high',
        defaultModel: 'claude-sonnet-5',
        fastMode: true,
      },
    })
    await open(page)

    await model(page).fill('   ')
    await saveModeration(page).click()

    await expect(page.getByRole('alert')).toBeVisible()
    expect(asked(graphql, 'setCreaSettings')).toEqual([
      { input: { model: null, effort: 'high', fastMode: true } },
    ])
  })

  test('says where the settings could not be saved', async ({ page, graphql }) => {
    graphql.answer({ setCreaSettings: new Failure('INVALID_MODEL') })
    await open(page)

    await model(page).fill('nonsense')
    await saveModeration(page).click()

    await expect(page.getByRole('alert')).toContainText('INVALID_MODEL')
    await expect(model(page)).toHaveValue('nonsense')
  })

  for (const [what, result, toast, tone] of [
    [
      'an answer, and the fast mode',
      { ok: true, code: 'ok', message: 'Hi', fastMode: 'active' },
      `Modell antwortet: Hi ${words.fastModeActive}`,
      'success',
    ],
    [
      'an empty answer, the fast mode busy',
      { ok: true, code: 'ok', message: '', fastMode: 'rate_limited' },
      `Modell antwortet: ${words.testNoText} ${words.fastModeBusy}`,
      'success',
    ],
    [
      'the fast mode refused',
      { ok: true, code: 'ok', message: 'Hi', fastMode: 'refused', fastModeDetail: 'not opus' },
      'Modell antwortet: Hi (schneller Modus abgelehnt: not opus – Crea antwortet normal)',
      'success',
    ],
    [
      'a failure',
      { ok: false, code: 'model_error', message: 'unknown model' },
      'Test fehlgeschlagen: unknown model',
      'danger',
    ],
    [
      'Claude switched off',
      { ok: false, code: 'api_inactive', message: '' },
      words.testInactive,
      'danger',
    ],
  ] as const) {
    test(`tells of a test of the model: ${what}`, async ({ page, graphql }) => {
      graphql.answer({ testCreaModel: { fastMode: 'off', fastModeDetail: '', ...result } })
      await open(page)

      await testButton(page).click()

      await expect(page.getByRole('alert')).toContainText(toast)
      await expect(page.getByRole('alert')).toHaveClass(new RegExp(`text-bg-${tone}`))
      expect(asked(graphql, 'testCreaModel')).toEqual([
        { input: { model: 'claude-opus-5', effort: 'high', fastMode: true } },
      ])
    })
  }
})

test.describe('the signer of first creations', () => {
  const query = (page: Page) => page.getByTestId('signer-query')
  const choice = (page: Page) => page.getByTestId('signer-choice')
  const save = (page: Page) => page.getByTestId('signer-save')

  test('is searched among administrators and moderators, and saved', async ({ page, graphql }) => {
    graphql.answer({
      setFirstCreationSigner: signer({
        userId: 3,
        firstName: 'First3',
        lastName: 'Last3',
        role: 'MODERATOR_AI',
      }),
    })
    await open(page)

    // one letter searches nothing
    await query(page).fill('F')
    await page.waitForTimeout(500)
    expect(graphql.sentFor('searchUsers')).toEqual([])
    await expect(page.getByText(words.signerNoMatch)).toHaveCount(0)

    // asked once, after the typing
    await query(page).pressSequentially('irst', { delay: 50 })
    await expect(choice(page).locator('option')).toHaveText([
      'First1 Last1 · ADMIN',
      'First3 Last3 · MODERATOR_AI',
    ])
    // the last search is for what was typed
    await expect
      .poll(() => asked(graphql, 'searchUsers').at(-1))
      .toEqual({
        query: 'First',
        filters: { byActivated: true, byDeleted: false },
        currentPage: 1,
        pageSize: 25,
        order: 'ASC',
      })
    // nobody chosen yet: nothing to save
    expect(await choice(page).evaluate((select: HTMLSelectElement) => select.selectedIndex)).toBe(
      -1,
    )
    await expect(save(page)).toBeDisabled()

    await choice(page).selectOption('3')
    await save(page).click()

    await expect(page.getByRole('alert')).toContainText(words.savedSigner)
    expect(asked(graphql, 'setFirstCreationSigner')).toEqual([{ userId: 3 }])
    await expect(page.getByTestId('first-creation-signer')).toHaveText(
      'Unterzeichner: First3 Last3 (MODERATOR_AI)',
    )
    await expect(query(page)).toHaveValue('')
    await expect(choice(page)).toHaveCount(0)
  })

  test('is searched once for what is typed in one go', async ({ page, graphql }, info) => {
    test.skip(
      info.project.name === 'old',
      'the old admin searches at once at two letters, and again',
    )
    await open(page)

    await query(page).pressSequentially('First', { delay: 50 })
    await expect(choice(page).locator('option')).toHaveCount(2)
    await page.waitForTimeout(500)

    expect(asked(graphql, 'searchUsers').map((sent) => sent.query)).toEqual(['First'])
  })

  test('is no longer chosen once the search no longer finds them', async ({ page }) => {
    await open(page)

    await query(page).fill('First')
    await choice(page).selectOption('1')
    await expect(save(page)).toBeEnabled()
    await query(page).fill('Other')

    await expect(choice(page).locator('option')).toHaveText(['Other Last4 · MODERATOR'])
    await expect(save(page)).toBeDisabled()
  })

  test('shows what the last search found, whatever answers late', async ({ page, graphql }) => {
    const held: ((answer: unknown) => void)[] = []
    graphql.answer({
      searchUsers: ({ query }: Variables) =>
        query === 'First'
          ? new Promise((resolve) => held.push(resolve))
          : searchUsers(FOUND.filter((found) => found.firstName === 'Other')),
    })
    await open(page)

    await query(page).fill('First')
    await expect.poll(() => held.length).toBe(1)
    await query(page).fill('Other')
    await expect(choice(page).locator('option')).toHaveText(['Other Last4 · MODERATOR'])
    held[0](searchUsers(FOUND))

    await page.waitForTimeout(300)
    await expect(choice(page).locator('option')).toHaveText(['Other Last4 · MODERATOR'])
  })

  test('says where nobody who may sign is found', async ({ page }) => {
    await open(page)

    await query(page).fill('member2')

    await expect(page.getByText(words.signerNoMatch)).toBeVisible()
    await expect(choice(page)).toHaveCount(0)
  })

  test('says why the server refused them', async ({ page, graphql }) => {
    graphql.answer({
      setFirstCreationSigner: new Failure('FIRST_CREATION_SIGNER_UNAVAILABLE: SCOPED'),
    })
    await open(page)

    await query(page).fill('Other')
    await choice(page).selectOption('4')
    await save(page).click()

    await expect(page.getByRole('alert')).toContainText(
      `Nicht gespeichert: ${words.signerReason.SCOPED}.`,
    )
    await expect(query(page)).toHaveValue('Other')
  })

  test('is removed, and the window of first creations is off', async ({ page, graphql }) => {
    graphql.answer({ setFirstCreationSigner: null })
    await open(page)

    await page.getByTestId('signer-remove').click()

    await expect(page.getByRole('alert')).toContainText(words.removedSigner)
    expect(asked(graphql, 'setFirstCreationSigner')).toEqual([{ userId: null }])
    await expect(page.getByTestId('first-creation-signer')).toHaveText(words.noSigner)
    await expect(page.getByTestId('signer-remove')).toBeDisabled()
  })

  test('says where the one set can no longer sign', async ({ page, graphql }) => {
    graphql.answer({
      creaSettings: settings({
        firstCreationSigner: signer({
          alias: 'sig',
          firstName: null,
          lastName: null,
          role: 'MODERATOR',
          eligible: false,
          reason: 'SCOPED',
        }),
      }),
    })
    await signIn(page, '/creaSettings')

    await expect(page.getByTestId('first-creation-signer')).toHaveText(
      `Unterzeichner: sig (MODERATOR)Dieses Konto kann nicht mehr unterschreiben: ${words.signerReason.SCOPED}. Bis ein anderes gewählt ist, bleibt das Fenster aus.`,
    )
  })
})

test.describe('the keywords of matching entries', () => {
  const save = (page: Page) => page.getByTestId('matching-keying-save')

  test('are switched on on their own', async ({ page, graphql }) => {
    graphql.answer({ setCreaMatchingKeying: true })
    await open(page)

    await keying(page).check()
    await save(page).click()

    await expect(page.getByRole('alert')).toContainText(words.savedMatching)
    expect(asked(graphql, 'setCreaMatchingKeying')).toEqual([{ active: true }])
    await expect(keyingWarning(page)).toHaveCount(0)
    expect(graphql.sentFor('setCreaSettings')).toEqual([])
  })

  test('show what is stored where somebody else switched meanwhile', async ({ page, graphql }) => {
    graphql.answer({ setCreaMatchingKeying: false })
    await open(page)

    await keying(page).check()
    await save(page).click()

    await expect(page.getByRole('alert')).toContainText(words.matchingChangedElsewhere)
    await expect(page.getByRole('alert')).toHaveClass(/text-bg-danger/)
    await expect(keying(page)).not.toBeChecked()
    await expect(keyingWarning(page)).toBeVisible()
  })

  test('keep a click made while saving', async ({ page, graphql }) => {
    let answer = (_: unknown) => undefined as unknown
    graphql.answer({
      setCreaMatchingKeying: () =>
        new Promise((resolve) => {
          answer = resolve
        }),
    })
    await open(page)

    await keying(page).check()
    await save(page).click()
    await keying(page).uncheck()
    answer(true)

    await expect(page.getByRole('alert')).toContainText(words.savedMatching)
    // the server holds it on, the box keeps the newer click
    await expect(keyingWarning(page)).toHaveCount(0)
    await expect(keying(page)).not.toBeChecked()
  })
})
