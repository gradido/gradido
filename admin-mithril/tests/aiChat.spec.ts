// AI-GENERATED — not an architecture reference
import type { Page } from '@playwright/test'
import de from '../../admin/src/locales/de.json' with { type: 'json' }
import { chatMessage, resumedChat } from './fixtures/aiChat'
import { contributionList, groups, listedContribution } from './fixtures/contributions'
import { type Answer, expect, Failure, test } from './fixtures/graphql'
import { moderator, signedInAnswers, signIn } from './fixtures/signIn'

type Variables = Record<string, unknown>

const answers = (who = moderator): Record<string, Answer> => ({
  ...signedInAnswers(who),
  ...resumedChat,
  adminListContributions: contributionList([listedContribution(1)]),
  creationGroups: groups,
  adminOpenCreations: [],
})

test.use({ permissions: ['clipboard-read', 'clipboard-write'] })

test.beforeEach(async ({ graphql }) => {
  graphql.answer(answers())
})

const openButton = (page: Page) => page.getByRole('button', { name: de.ai['chat-open'] })
const messages = (page: Page) => page.locator('.inner-container > span')
const sendButton = (page: Page) => page.getByRole('button', { name: de.send, exact: false })
const asked = (
  graphql: { sentFor: (field: string) => { variables: Variables }[] },
  field: string,
) => graphql.sentFor(field).map((sent) => sent.variables)
const openChat = async (page: Page) => {
  await signIn(page, '/creation-confirm')
  await openButton(page).click()
}
const chatField = (page: Page) =>
  page.getByPlaceholder(/^(Schreibe eine Nachricht|Warte, ich denke nach)/)

test('takes up the last conversation, and sends nothing', async ({ page, graphql }) => {
  graphql.answer({
    resumeChat: [
      chatMessage({ role: 'user', content: '/start' }),
      chatMessage({ content: 'Hi\n[SIGNATUR]' }),
      chatMessage({ role: 'user', content: 'My text' }),
      chatMessage({ content: '', errorCode: 'send_failed', threadId: null }),
    ],
  })
  await signIn(page, '/creation-confirm')
  await expect(page.locator('.open-creations-table')).toHaveClass(/beside-crea-chat/)
  await openButton(page).click()

  // the opening word the interface sent is no message of the moderator's
  await expect(messages(page)).toHaveText(['Hi [SIGNATUR]', 'My text', de.ai['error-send-failed']])
  await expect(page.getByText(de.ai['signature-missing'])).toBeVisible()
  // a copy of Crea's words, not of the moderator's nor of an error
  await expect(page.getByRole('button', { name: de['copy-to-clipboard'] })).toHaveCount(1)
  expect(graphql.sentFor('sendMessage')).toEqual([])

  // the signature set in Crea's window meanwhile takes its place
  await page.evaluate(() => localStorage.setItem('crea.moderatorSignature', 'Yours, Peter'))
  await page.getByRole('button', { name: de.close }).click()
  await expect(chatField(page)).toHaveCount(0)
  await openButton(page).click()
  await expect(messages(page).first()).toHaveText('Hi Yours, Peter')
  await expect(page.getByText(de.ai['signature-missing'])).toHaveCount(0)
})

test('lets Crea greet where there is no conversation', async ({ page, graphql }) => {
  graphql.answer({ resumeChat: [], sendMessage: chatMessage({ content: 'Hello, I am Crea.' }) })
  await openChat(page)

  await expect(messages(page)).toHaveText(['Hello, I am Crea.'])
  expect(asked(graphql, 'sendMessage')).toEqual([{ input: { message: '/start', threadId: '' } }])
})

test('says where the conversation could not be read, and starts none', async ({
  page,
  graphql,
}) => {
  graphql.answer({ resumeChat: new Failure('Gone') })
  await signIn(page, '/creation-confirm')

  await expect(page.getByRole('alert')).toContainText(
    de.ai['error-load'].replace('{error}', 'Gone'),
  )
  expect(graphql.sentFor('sendMessage')).toEqual([])
})

test('sends with Ctrl+Enter, not with Enter, and goes on in the conversation', async ({
  page,
  graphql,
}) => {
  // Crea's answer, held back until the test lets it go
  let answer: (reply: unknown) => void = () => undefined
  graphql.answer({
    sendMessage: () =>
      new Promise((resolve) => {
        answer = resolve
      }),
  })
  await openChat(page)

  await chatField(page).fill('Please judge')
  await chatField(page).press('Enter')
  expect(graphql.sentFor('sendMessage')).toEqual([])
  await chatField(page).press('Control+Enter')

  // shown at once, and the field waits for Crea
  await expect(messages(page).last()).toHaveText('Please judge')
  await expect(chatField(page)).toBeDisabled()
  await expect(chatField(page)).toHaveAttribute('placeholder', de.ai['chat-placeholder-loading'])
  await expect(chatField(page)).toHaveValue('')
  await expect(sendButton(page)).toHaveText(`${de.send}...`)
  expect(asked(graphql, 'sendMessage')).toEqual([
    { input: { message: 'Please judge\n', threadId: 'thread-1' } },
  ])

  answer(chatMessage({ content: 'Reply' }))
  await expect(messages(page).last()).toHaveText('Reply')
  await expect(chatField(page)).toBeEnabled()
  await expect(sendButton(page)).toHaveText(de.send)
})

test('sends with the button and Cmd+Enter, and stays in the conversation an error leaves', async ({
  page,
  graphql,
}) => {
  graphql.answer({
    sendMessage: chatMessage({ content: '', errorCode: 'output_too_long', threadId: null }),
  })
  await openChat(page)
  // words of whitespace alone are no message
  await chatField(page).fill('  ')
  await sendButton(page).click()
  expect(graphql.sentFor('sendMessage')).toEqual([])

  await chatField(page).fill('A long paste')
  await sendButton(page).click()
  await expect(messages(page).last()).toHaveText(de.ai['error-output-too-long'])

  await chatField(page).fill('Shorter')
  await chatField(page).press('Meta+Enter')
  await expect(messages(page)).toHaveCount(5)
  expect(asked(graphql, 'sendMessage')).toEqual([
    { input: { message: 'A long paste', threadId: 'thread-1' } },
    { input: { message: 'Shorter', threadId: 'thread-1' } },
  ])
})

test('says where a message could not be sent', async ({ page, graphql }) => {
  graphql.answer({ sendMessage: new Failure('Overloaded') })
  await openChat(page)

  await chatField(page).fill('Hello')
  await sendButton(page).click()

  await expect(page.getByRole('alert')).toContainText(
    de.ai['error-send'].replace('{error}', 'Overloaded'),
  )
  await expect(chatField(page)).toBeEnabled()
})

test.describe('clearing the conversation', () => {
  test('throws it away and lets Crea greet anew', async ({ page, graphql }) => {
    graphql.answer({
      deleteThread: true,
      sendMessage: chatMessage({ content: 'Fresh', threadId: 'thread-2' }),
    })
    await openChat(page)

    await page.getByRole('button', { name: de.ai['chat-clear'] }).click()

    await expect(messages(page)).toHaveText(['Fresh'])
    await expect(page.getByRole('alert')).toContainText(de.ai['chat-thread-deleted'])
    expect(asked(graphql, 'deleteThread')).toEqual([{ threadId: 'thread-1' }])
    expect(asked(graphql, 'sendMessage')).toEqual([{ input: { message: '/start', threadId: '' } }])
  })

  test('starts anew without a word where it was gone already', async ({ page, graphql }) => {
    graphql.answer({ deleteThread: false, sendMessage: chatMessage({ content: 'Fresh' }) })
    await openChat(page)

    await page.getByRole('button', { name: de.ai['chat-clear'] }).click()

    await expect(messages(page)).toHaveText(['Fresh'])
    await expect(page.getByRole('alert')).toHaveCount(0)
  })

  test('keeps it where it could not be cleared', async ({ page, graphql }) => {
    graphql.answer({ deleteThread: new Failure('Nope') })
    await openChat(page)

    await page.getByRole('button', { name: de.ai['chat-clear'] }).click()

    await expect(page.getByRole('alert')).toContainText(
      de.ai['error-chat-thread-deleted'].replace('{error}', ''),
    )
    await expect(page.getByRole('alert')).toContainText('Nope')
    await expect(messages(page)).toHaveText(['Hello, I am Crea.'])
    expect(graphql.sentFor('sendMessage')).toEqual([])
  })

  test('starts anew at once where none is stored', async ({ page, graphql }) => {
    graphql.answer({
      resumeChat: [chatMessage({ content: '', errorCode: 'thread_not_found', threadId: null })],
      sendMessage: chatMessage({ content: 'Fresh' }),
    })
    await openChat(page)
    await expect(messages(page)).toHaveText([de.ai['error-thread-not-found']])

    await page.getByRole('button', { name: de.ai['chat-clear'] }).click()

    await expect(messages(page)).toHaveText(['Fresh'])
    expect(graphql.sentFor('deleteThread')).toEqual([])
  })
})

test('copies what Crea wrote, with the signature', async ({ page, graphql }) => {
  graphql.answer({ resumeChat: [chatMessage({ content: 'Hi\n[SIGNATUR]' })] })
  await page.addInitScript(() => localStorage.setItem('crea.moderatorSignature', 'Yours, Peter'))
  await openChat(page)

  await page.getByRole('button', { name: de['copy-to-clipboard'] }).click()

  await expect(page.getByRole('alert')).toContainText(de['copied-to-clipboard'])
  expect(await page.evaluate(() => navigator.clipboard.readText())).toBe('Hi\nYours, Peter')
})

test('is there only for a moderator with Crea', async ({ page, graphql }) => {
  const plain = { ...moderator, role: 'MODERATOR' }
  graphql.answer(answers(plain))
  await signIn(page, '/creation-confirm', plain)

  await expect(page.locator('.open-creations-table')).toBeVisible()
  await expect(openButton(page)).toHaveCount(0)
  await expect(page.locator('.open-creations-table')).not.toHaveClass(/beside-crea-chat/)
  expect(graphql.sentFor('resumeChat')).toEqual([])
})

test('leaves the last buttons of a row where they are on a phone', async ({ page }) => {
  await page.setViewportSize({ width: 375, height: 700 })
  await signIn(page, '/creation-confirm')

  await expect(openButton(page)).toBeVisible()
  await expect(page.locator('.open-creations-table')).not.toHaveClass(/beside-crea-chat/)
})
