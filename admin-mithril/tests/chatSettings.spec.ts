// AI-GENERATED — not an architecture reference
import type { Page } from '@playwright/test'
import de from '../../admin/src/locales/de.json' with { type: 'json' }
import { expect, Failure, test } from './fixtures/graphql'
import { signedInAnswers, signIn } from './fixtures/signIn'

type Variables = Record<string, unknown>
const words = de.chatAdmin

const ago = (seconds: number) => new Date(Date.now() - seconds * 1000).toISOString()
const check = (more: Record<string, unknown> = {}) => ({
  __typename: 'ChatVideoServerCheck',
  ok: true,
  reason: null,
  checkedAt: ago(130),
  latencyMs: 80,
  picks: 3,
  ...more,
})
// the old admin's Apollo fills a fragment only where the type is named
const server = (id: number, more: Record<string, unknown> = {}) => ({
  __typename: 'ChatVideoServerRow',
  id,
  baseUrl: `https://meet${id}.example.org`,
  host: `meet${id}.example.org`,
  operator: 'Op',
  roomPrefix: 'gdd',
  note: 'Note',
  active: true,
  createdAt: '2026-10-01T10:00:00.000Z',
  updatedAt: '2026-10-01T10:00:00.000Z',
  check: null,
  ...more,
})
// timed as the page is opened
const servers = () => [
  server(1, { check: check() }),
  server(2, {
    active: false,
    operator: null,
    roomPrefix: null,
    note: null,
    // the server's clock a little ahead: still a second ago
    check: check({ ok: false, reason: 'NO_BOSH', checkedAt: ago(-30), latencyMs: null, picks: 0 }),
  }),
  server(3),
]

test.beforeEach(async ({ graphql }) => {
  graphql.answer({ ...signedInAnswers(), chatVideoServers: servers })
})

const row = (page: Page, id: number) => page.getByTestId(`server-${id}`)
const dialog = (page: Page) => page.getByRole('dialog')
const toast = (page: Page) => page.getByRole('alert')
const asked = (graphql: { sentFor: (field: string) => { variables: Variables }[] }, name: string) =>
  graphql.sentFor(name).map((sent) => sent.variables)
const loads = (graphql: { sentFor: (field: string) => unknown[] }) =>
  graphql.sentFor('chatVideoServers').length
const open = async (page: Page) => {
  await signIn(page, '/chat')
  await expect(page.locator('.chat-server-list > li')).toHaveCount(3)
}
// an answer the test hands over when it chooses
const holding = () => {
  const held: ((answer: unknown) => void)[] = []
  return { held, answer: () => new Promise((resolve) => held.push(resolve)) }
}

test('lists the servers, and how they answered', async ({ page }) => {
  await open(page)

  await expect(page.locator('.h2')).toHaveText(words.title)
  await expect(page.getByText(words.servers.hint)).toBeVisible()
  await expect(row(page, 1)).toContainText('https://meet1.example.org')
  await expect(page.getByTestId('details-1')).toHaveText('Op · Präfix gdd · Note')
  await expect(page.getByTestId('state-1')).toHaveText(
    'antwortet, 80 ms' + 'zuletzt geprüft vor 2 Minuten' + 'Einladungen seit dem Serverstart: 3',
  )
  await expect(page.getByTestId('state-1').locator('.text-success')).toBeVisible()

  await expect(page.getByTestId('details-2')).toHaveText(words.servers.noOperator)
  await expect(page.getByTestId('state-2')).toContainText(
    'antwortet nicht: keine XMPP-Antwortzuletzt geprüft vor 1 Sekunde',
  )
  await expect(page.getByTestId('state-2').locator('.text-danger')).toBeVisible()

  await expect(page.getByTestId('state-3')).toHaveText(words.state.unchecked)
  await expect(page.getByTestId('state-3').locator('.text-secondary')).toBeVisible()

  await expect(page.getByTestId('active-1')).toBeChecked()
  await expect(page.getByTestId('active-2')).not.toBeChecked()
  await expect(page.getByTestId('active-1')).toHaveAttribute('title', words.servers.activeTitle)
})

test('says what it does not know as it came, and how long ago in hours and days', async ({
  page,
  graphql,
}) => {
  graphql.answer({
    chatVideoServers: [
      server(1, { check: check({ checkedAt: ago(3 * 3600), latencyMs: null }) }),
      server(2, {
        check: check({ ok: false, reason: 'SOMETHING_NEW', checkedAt: ago(2 * 86400) }),
      }),
    ],
  })
  await signIn(page, '/chat')

  await expect(page.getByTestId('state-1')).toContainText(
    'antwortet, – mszuletzt geprüft vor 3 Stunden',
  )
  await expect(page.getByTestId('state-2')).toContainText(
    'antwortet nicht: SOMETHING_NEWzuletzt geprüft vor 2 Tagen',
  )
})

test('says so where the list is empty', async ({ page, graphql }) => {
  graphql.answer({ chatVideoServers: [] })
  await signIn(page, '/chat')

  await expect(page.getByTestId('servers-empty')).toHaveText(words.servers.empty)
  await expect(page.locator('.chat-server-list')).toHaveCount(0)
})

test('says where the list could not be read', async ({ page, graphql }) => {
  graphql.answer({ chatVideoServers: new Failure('no database') })
  await signIn(page, '/chat')

  await expect(toast(page)).toContainText('no database')
  await expect(page.getByTestId('servers-empty')).toHaveCount(0)
})

test.describe('checking now', () => {
  test('counts who answers, and reads the list anew', async ({ page, graphql }) => {
    const { held, answer } = holding()
    graphql.answer({ checkChatVideoServersNow: answer })
    await open(page)

    await page.getByTestId('check-now').click()
    await expect(page.getByTestId('check-now')).toHaveText(words.servers.checking)
    await expect(page.getByTestId('check-now')).toBeDisabled()
    await expect.poll(() => held.length).toBe(1)
    held[0]([server(1, { check: check() }), server(2, { check: check({ ok: false }) }), server(3)])

    await expect(toast(page)).toContainText('1 von 3 antworten.')
    await expect(page.getByTestId('check-now')).toHaveText(words.servers.checkNow)
    await expect.poll(() => loads(graphql)).toBe(2)
  })

  test('says where it failed, and reads the list anew', async ({ page, graphql }) => {
    graphql.answer({ checkChatVideoServersNow: new Failure('busy') })
    await open(page)

    await page.getByTestId('check-now').click()

    await expect(toast(page)).toContainText('busy')
    await expect.poll(() => loads(graphql)).toBe(2)
  })
})

test.describe('the tick in the random choice', () => {
  test('is switched at once, with the row as it stands', async ({ page, graphql }) => {
    const { held, answer } = holding()
    graphql.answer({ updateChatVideoServer: answer })
    await open(page)

    await page.getByTestId('active-1').uncheck()
    await expect(page.getByTestId('active-1')).toBeDisabled()
    await expect.poll(() => held.length).toBe(1)
    held[0](server(1, { active: false }))

    await expect(toast(page)).toContainText(
      'meet1.example.org ist nicht mehr in der Zufallsauswahl.',
    )
    await expect(page.getByTestId('active-1')).toBeEnabled()
    expect(asked(graphql, 'updateChatVideoServer')).toEqual([
      {
        id: 1,
        input: {
          baseUrl: 'https://meet1.example.org',
          operator: 'Op',
          roomPrefix: 'gdd',
          note: 'Note',
          active: false,
        },
      },
    ])
    await expect.poll(() => loads(graphql)).toBe(2)
  })

  test('says when a server is taken in', async ({ page, graphql }) => {
    graphql.answer({ updateChatVideoServer: server(2, { active: true }) })
    await open(page)

    await page.getByTestId('active-2').check()

    await expect(toast(page)).toContainText('meet2.example.org ist jetzt in der Zufallsauswahl.')
    expect(asked(graphql, 'updateChatVideoServer')[0]).toMatchObject({
      id: 2,
      input: { operator: null, roomPrefix: null, note: null, active: true },
    })
  })

  test('shows what the server holds where it refused', async ({ page, graphql }) => {
    graphql.answer({ updateChatVideoServer: new Failure('CHAT_VIDEO_SERVER_NOT_FOUND') })
    await open(page)

    await page.getByTestId('active-1').click()

    await expect(toast(page)).toContainText(words.errors.notFound)
    await expect(page.getByTestId('active-1')).toBeChecked()
    await expect(page.getByTestId('active-1')).toBeEnabled()
    await expect.poll(() => loads(graphql)).toBe(2)
  })

  test('of one row stays locked while only another one is answered', async ({
    page,
    graphql,
  }, info) => {
    test.skip(info.project.name === 'old', 'the old page locked only the row switched last')
    const { held, answer } = holding()
    graphql.answer({ updateChatVideoServer: answer })
    await open(page)

    await page.getByTestId('active-1').uncheck()
    await page.getByTestId('active-2').check()
    await expect.poll(() => held.length).toBe(2)
    held[0](server(1, { active: false }))

    await expect(toast(page)).toBeVisible()
    await expect(page.getByTestId('active-1')).toBeEnabled()
    await expect(page.getByTestId('active-2')).toBeDisabled()
    await expect(page.getByTestId('active-2')).toBeChecked()
  })
})

test.describe('editing a server', () => {
  const field = (page: Page, name: string) => page.getByTestId(`edit-${name}`)

  test('saves the fields trimmed, empty as none, without the tick', async ({ page, graphql }) => {
    graphql.answer({ updateChatVideoServer: server(1) })
    await open(page)

    await page.getByTestId('edit-1').click()
    await expect(field(page, 'base-url')).toHaveValue('https://meet1.example.org')
    await expect(field(page, 'operator')).toHaveValue('Op')
    await expect(field(page, 'prefix')).toHaveValue('gdd')
    await expect(field(page, 'note')).toHaveValue('Note')
    await expect(field(page, 'operator')).toHaveAttribute('placeholder', words.form.operator)
    await expect(field(page, 'base-url')).toHaveAttribute('maxlength', '255')

    await field(page, 'base-url').fill('   ')
    await expect(page.getByTestId('edit-save')).toBeDisabled()
    await field(page, 'base-url').fill(' https://other.example.org ')
    await field(page, 'operator').fill('  ')
    await field(page, 'note').fill(' New ')
    await page.getByTestId('edit-save').click()

    await expect(toast(page)).toContainText(words.updated)
    await expect(field(page, 'base-url')).toHaveCount(0)
    expect(asked(graphql, 'updateChatVideoServer')).toEqual([
      {
        id: 1,
        input: {
          baseUrl: 'https://other.example.org',
          operator: null,
          roomPrefix: 'gdd',
          note: 'New',
        },
      },
    ])
    await expect.poll(() => loads(graphql)).toBe(2)
  })

  test('is cancelled without a word to the server', async ({ page, graphql }) => {
    await open(page)

    await page.getByTestId('edit-3').click()
    await field(page, 'note').fill('changed')
    await page.getByTestId('edit-cancel').click()

    await expect(page.getByTestId('details-3')).toHaveText('Op · Präfix gdd · Note')
    expect(graphql.sentFor('updateChatVideoServer')).toHaveLength(0)
  })

  test('stays open where the server refused, and says why', async ({ page, graphql }) => {
    graphql.answer({ updateChatVideoServer: new Failure('CHAT_VIDEO_SERVER_INVALID: NOT_HTTPS') })
    await open(page)

    await page.getByTestId('edit-1').click()
    await field(page, 'base-url').fill('http://meet1.example.org')
    await page.getByTestId('edit-save').click()

    await expect(toast(page)).toContainText(words.errors.invalid.NOT_HTTPS)
    await expect(field(page, 'base-url')).toHaveValue('http://meet1.example.org')
    await expect(page.getByTestId('edit-save')).toBeEnabled()
  })

  test('of another row is left open by a save answered late', async ({ page, graphql }, info) => {
    test.skip(info.project.name === 'old', 'the old page closed whichever row was open')
    const { held, answer } = holding()
    graphql.answer({ updateChatVideoServer: answer })
    await open(page)

    await page.getByTestId('edit-1').click()
    await page.getByTestId('edit-save').click()
    await expect.poll(() => held.length).toBe(1)
    await page.getByTestId('edit-3').click()
    await field(page, 'note').fill('typed meanwhile')
    held[0](server(1))

    await expect(toast(page)).toContainText(words.updated)
    await expect(field(page, 'note')).toHaveValue('typed meanwhile')
  })
})

test.describe('removing a server', () => {
  const confirm = (page: Page) => dialog(page).locator('.modal-footer .btn-danger')

  test('asks first, then removes it', async ({ page, graphql }) => {
    const { held, answer } = holding()
    graphql.answer({ deleteChatVideoServer: answer })
    await open(page)

    await page.getByTestId('remove-1').click()
    await expect(dialog(page).locator('.modal-title')).toHaveText(words.removeDialog.title)
    await expect(dialog(page)).toContainText('meet1.example.org aus der Liste löschen?')
    await expect(dialog(page)).toContainText(words.removeDialog.hint)
    await expect(confirm(page)).toHaveText(words.removeDialog.confirm)
    await confirm(page).click()
    await expect(confirm(page)).toBeDisabled()
    await expect.poll(() => held.length).toBe(1)
    held[0](true)

    await expect(toast(page)).toContainText(words.removed)
    await expect(dialog(page)).toBeHidden()
    expect(asked(graphql, 'deleteChatVideoServer')).toEqual([{ id: 1 }])
    await expect.poll(() => loads(graphql)).toBe(2)
  })

  test('is cancelled without a word to the server', async ({ page, graphql }) => {
    await open(page)

    await page.getByTestId('remove-2').click()
    await expect(dialog(page)).toContainText('meet2.example.org aus der Liste löschen?')
    await dialog(page).locator('.modal-footer .btn-secondary').click()

    await expect(dialog(page)).toBeHidden()
    expect(graphql.sentFor('deleteChatVideoServer')).toHaveLength(0)
  })

  test('closes the question where it failed, and says why', async ({ page, graphql }) => {
    graphql.answer({ deleteChatVideoServer: new Failure('CHAT_VIDEO_SERVER_NOT_FOUND') })
    await open(page)

    await page.getByTestId('remove-1').click()
    await confirm(page).click()

    await expect(toast(page)).toContainText(words.errors.notFound)
    await expect(dialog(page)).toBeHidden()
    await expect.poll(() => loads(graphql)).toBe(2)
  })

  test('answered late leaves the question asked since open', async ({ page, graphql }, info) => {
    test.skip(info.project.name === 'old', 'the old page closed whichever question was open')
    const { held, answer } = holding()
    graphql.answer({ deleteChatVideoServer: answer })
    await open(page)

    await page.getByTestId('remove-1').click()
    await confirm(page).click()
    await expect.poll(() => held.length).toBe(1)
    await dialog(page).locator('.modal-footer .btn-secondary').click()
    await page.getByTestId('remove-2').click()
    held[0](true)

    await expect(toast(page)).toContainText(words.removed)
    await expect(dialog(page)).toContainText('meet2.example.org aus der Liste löschen?')
    await expect(confirm(page)).toBeEnabled()
  })
})

test.describe('adding a server', () => {
  const field = (page: Page, name: string) => page.getByTestId(`form-${name}`)

  test('takes the fields trimmed, with the tick, and empties the form', async ({
    page,
    graphql,
  }) => {
    graphql.answer({ createChatVideoServer: server(4) })
    await open(page)

    await expect(page.getByLabel(words.form.baseUrl, { exact: true })).toHaveAttribute(
      'placeholder',
      'https://',
    )
    await expect(page.getByText(words.form.prefixHint)).toBeVisible()
    await expect(field(page, 'add')).toBeDisabled()
    await field(page, 'base-url').fill('  ')
    await expect(field(page, 'add')).toBeDisabled()
    await field(page, 'base-url').fill(' https://meet4.example.org ')
    await page.getByLabel(words.form.operator, { exact: true }).fill(' Op ')
    await page.getByLabel(words.form.prefix, { exact: true }).fill('gdd')
    await expect(field(page, 'active')).toBeChecked()
    await field(page, 'active').uncheck()
    await field(page, 'add').click()

    await expect(toast(page)).toContainText(words.created)
    await expect(field(page, 'base-url')).toHaveValue('')
    await expect(field(page, 'operator')).toHaveValue('')
    await expect(field(page, 'active')).toBeChecked()
    expect(asked(graphql, 'createChatVideoServer')).toEqual([
      {
        input: {
          baseUrl: 'https://meet4.example.org',
          operator: 'Op',
          roomPrefix: 'gdd',
          note: null,
          active: false,
        },
      },
    ])
    await expect.poll(() => loads(graphql)).toBe(2)
  })

  test('keeps the form where the server refused, and says why', async ({ page, graphql }) => {
    graphql.answer({ createChatVideoServer: new Failure('CHAT_VIDEO_SERVER_DUPLICATE') })
    await open(page)

    await field(page, 'base-url').fill('https://meet1.example.org')
    await field(page, 'add').click()

    await expect(toast(page)).toContainText(words.errors.duplicate)
    await expect(field(page, 'base-url')).toHaveValue('https://meet1.example.org')
    await expect(field(page, 'add')).toBeEnabled()
    await expect.poll(() => loads(graphql)).toBe(2)
  })

  test('names an unknown objection with its code', async ({ page, graphql }) => {
    graphql.answer({ createChatVideoServer: new Failure('CHAT_VIDEO_SERVER_INVALID: ODD_THING') })
    await open(page)

    await field(page, 'base-url').fill('https://x.example.org')
    await field(page, 'add').click()

    await expect(toast(page)).toContainText('Der Eintrag passt nicht (ODD_THING).')
  })
})
