// AI-GENERATED — not an architecture reference
import type { Page } from '@playwright/test'
import de from '../../admin/src/locales/de.json' with { type: 'json' }
import { resumedChat } from './fixtures/aiChat'
import {
  contributionList,
  contributor,
  groups,
  listedContribution,
  threadAnswers,
  threadMessage,
} from './fixtures/contributions'
import { type Answer, expect, Failure, test } from './fixtures/graphql'
import { moderator, signedInAnswers, signIn } from './fixtures/signIn'

type Variables = Record<string, unknown>
type Ref = { gradidoID: string; communityUuid: string }

const PICTURED = '2026-10-01T00:00:00.000Z'
// what the server hands out, small and large: the test reads only where each one lands
const small = (ref: Ref) => `small-${ref.gradidoID.slice(-1)}`
const large = (ref: Ref) => `large-${ref.gradidoID.slice(-1)}`
const source = (picture: string) => `data:image/jpeg;base64,${picture}`

const withPicture = (id: number) =>
  listedContribution(id, id, { user: contributor(id, { avatarUpdatedAt: PICTURED }) })

const answers = (more: Record<string, Answer> = {}): Record<string, Answer> => ({
  ...signedInAnswers(),
  ...resumedChat,
  // members 1 and 2 show a picture, member 3 their letters
  adminListContributions: contributionList([withPicture(1), withPicture(2), listedContribution(3)]),
  creationGroups: groups,
  adminOpenCreations: [],
  contactRefs: [],
  memberAvatars: ({ refs }: Variables) =>
    (refs as Ref[]).map((ref) => ({ ...ref, avatarUpdatedAt: PICTURED, avatar: small(ref) })),
  memberAvatarFull: ({ ref }: Variables) => large(ref as Ref),
  ...more,
})

test.beforeEach(async ({ graphql }) => {
  graphql.answer(answers())
})

const circle = (page: Page, index: number) =>
  page.locator('.open-creations-table > table > tbody > tr').nth(index).getByTestId('member-avatar')
const zoom = {
  small: (page: Page) => page.getByTestId('member-avatar-zoom-small'),
  large: (page: Page) => page.getByTestId('member-avatar-zoom-full'),
  closer: (page: Page) => page.getByTestId('member-avatar-zoom-closer'),
}
const ref = (id: number) => ({
  gradidoID: contributor(id).gradidoID,
  communityUuid: moderator.communityUuid,
})

test('shows the picture of a member large, the small one first', async ({ page, graphql }) => {
  let answer = (_: unknown) => undefined as unknown
  graphql.answer({
    memberAvatarFull: () =>
      new Promise((resolve) => {
        answer = resolve
      }),
  })
  await signIn(page, '/creation-confirm')

  await expect(circle(page, 0)).toHaveAttribute('title', 'Bild von member1 vergrößern')
  await circle(page, 0).click()

  await expect(zoom.small(page)).toHaveAttribute('src', source(small(ref(1))))
  await expect(zoom.small(page)).toHaveAttribute('alt', 'Bild von member1')
  await expect(zoom.large(page)).toHaveCount(0)
  answer(large(ref(1)))
  await expect(zoom.large(page)).toHaveAttribute('src', source(large(ref(1))))
  expect(graphql.sentFor('memberAvatarFull').map((sent) => sent.variables)).toEqual([
    { ref: ref(1) },
  ])
})

test('closes with a tap on the picture', async ({ page }) => {
  await signIn(page, '/creation-confirm')
  await circle(page, 0).click()
  await expect(zoom.large(page)).toBeVisible()

  await zoom.closer(page).click()

  await expect(zoom.closer(page)).toBeHidden()
})

test('closes on Escape', async ({ page }, info) => {
  test.skip(info.project.name === 'old', 'the old window says it closes on Escape, and does not')
  await signIn(page, '/creation-confirm')
  await circle(page, 0).click()
  await expect(zoom.large(page)).toBeVisible()

  await page.keyboard.press('Escape')

  await expect(zoom.closer(page)).toBeHidden()
})

test('opens nothing from a circle of letters', async ({ page }) => {
  await signIn(page, '/creation-confirm')

  await expect(circle(page, 2)).toHaveText('ME')
  await expect(circle(page, 2)).not.toHaveAttribute('title')
  await circle(page, 2).click()
  await expect(zoom.closer(page)).toBeHidden()
})

test('stays with the small picture where the large one cannot be had', async ({
  page,
  graphql,
}) => {
  graphql.answer({ memberAvatarFull: new Failure('gone') })
  await signIn(page, '/creation-confirm')
  await circle(page, 0).click()

  await expect(zoom.small(page)).toBeVisible()
  await expect.poll(() => graphql.sentFor('memberAvatarFull').length).toBe(1)
  await expect(zoom.large(page)).toHaveCount(0)
  await expect(page.getByRole('alert')).toHaveCount(0)
})

test('shows no large picture of somebody shown before', async ({ page, graphql }) => {
  const held: ((picture: string) => void)[] = []
  graphql.answer({
    memberAvatarFull: ({ ref }: Variables) =>
      (ref as Ref).gradidoID === ref1.gradidoID
        ? new Promise((resolve) => held.push(resolve))
        : large(ref as Ref),
  })
  const ref1 = ref(1)
  await signIn(page, '/creation-confirm')

  await circle(page, 0).click()
  await expect(zoom.small(page)).toBeVisible()
  await zoom.closer(page).click()
  await circle(page, 1).click()
  await expect(zoom.large(page)).toHaveAttribute('src', source(large(ref(2))))
  await expect.poll(() => held.length).toBe(1)
  held[0](large(ref1))

  // the answer for member 1 comes late, into the window of member 2
  await page.waitForTimeout(300)
  await expect(zoom.large(page)).toHaveAttribute('src', source(large(ref(2))))
  await expect(zoom.small(page)).toHaveAttribute('src', source(small(ref(2))))
})

test('shows the face of who wrote in the thread large', async ({ page, graphql }) => {
  graphql.answer(
    threadAnswers([threadMessage(1, { userAvatarUpdatedAt: PICTURED, userAlias: 'writer' })]),
  )
  await signIn(page, '/creation-confirm')
  await page
    .locator('.open-creations-table > table > tbody > tr')
    .first()
    .getByRole('button', { name: de.details, exact: false })
    .click()

  const face = page.locator('.message-bubble').getByTestId('member-avatar')
  await expect(face).toHaveAttribute('title', 'Bild von writer vergrößern')
  await face.click()

  await expect(zoom.small(page)).toHaveAttribute('alt', 'Bild von writer')
})
