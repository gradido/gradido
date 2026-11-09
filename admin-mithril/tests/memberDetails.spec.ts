// AI-GENERATED — not an architecture reference
import type { Page } from '@playwright/test'
import de from '../../admin/src/locales/de.json' with { type: 'json' }
import { expect, Failure, test } from './fixtures/graphql'
import { creationGroups, memberDetailsAnswers } from './fixtures/memberDetails'
import { moderator, signedInAnswers, signIn } from './fixtures/signIn'
import { member, searchUsers } from './fixtures/users'

type Variables = Record<string, unknown>

const user = member(1, { findableOnMap: true })
const aModerator = member(2, { role: 'MODERATOR' })
const deleted = member(3, { deletedAt: '2026-05-01T00:00:00.000Z' })
const self = member(5, { gradidoID: moderator.gradidoID, alias: 'peter' })
const notAnAdmin = { ...moderator, role: 'MODERATOR' }

test.beforeEach(async ({ graphql }) => {
  graphql.answer({
    ...signedInAnswers(),
    ...memberDetailsAnswers,
    searchUsers: searchUsers([user, aModerator, deleted, self]),
    contactRefs: [],
  })
})

const row = (page: Page, index: number) =>
  page.locator('.search-user-table > table > tbody > tr.pointer').nth(index)
const details = (page: Page) => page.locator('.row-details-card')
const openTab = async (page: Page, index: number, tab: string) => {
  await row(page, index).locator('td').first().click()
  await details(page).getByRole('tab', { name: tab }).click()
}
// the old admin's label names an id no select has: the select by its place
const roleSelect = (page: Page) => details(page).locator('select.role-select:not([multiple])')
const dialog = (page: Page) => page.getByRole('dialog')

test('asks for what a tab shows only once it is opened', async ({ page, graphql }, info) => {
  test.skip(info.project.name === 'old', 'the old admin asks for every tab as the row opens')
  await signIn(page, '/user')
  await row(page, 0).locator('td').first().click()
  await expect(details(page)).toBeVisible()
  expect(graphql.sentFor('creationGroups')).toEqual([])
  await details(page).getByRole('tab', { name: de.userRole.tabTitle }).click()

  await expect.poll(() => graphql.sentFor('creationGroups').length).toBe(1)
  await details(page).getByRole('tab', { name: de.delete_user }).click()
  await details(page).getByRole('tab', { name: de.userRole.tabTitle }).click()
  // a tab once opened stays, and asks no more
  expect(graphql.sentFor('creationGroups')).toHaveLength(1)
})

test.describe('the role', () => {
  test('asks before it changes the role, and says so', async ({ page, graphql }) => {
    graphql.answer({ setUserRole: 'MODERATOR' })
    await signIn(page, '/user')
    await openTab(page, 0, de.userRole.tabTitle)
    const select = roleSelect(page)
    await expect(select).toHaveValue('USER')
    await select.selectOption('MODERATOR')
    await details(page).getByRole('button', { name: de.change_user_role }).click()

    await expect(dialog(page)).toContainText(de.overlay.changeUserRole.title)
    await expect(dialog(page)).toContainText(
      de.overlay.changeUserRole.question
        .replace('{username}', 'First1 Last1')
        .replace('{newRole}', de.userRole.selectRoles.moderator),
    )
    await dialog(page).getByRole('button', { name: de.overlay.changeUserRole.yes }).click()

    await expect(page.getByRole('alert')).toContainText(
      de.userRole.successfullyChangedTo.replace('{role}', de.userRole.selectRoles.moderator),
    )
    expect(graphql.sentFor('setUserRole')).toEqual([
      { field: 'setUserRole', variables: { userId: 1, role: 'MODERATOR' } },
    ])
  })

  test('sends no role for a usual member', async ({ page, graphql }) => {
    graphql.answer({ setUserRole: null })
    await signIn(page, '/user')
    await openTab(page, 1, de.userRole.tabTitle)
    await roleSelect(page).selectOption('USER')
    await details(page).getByRole('button', { name: de.change_user_role }).click()
    await dialog(page).getByRole('button', { name: de.overlay.changeUserRole.yes }).click()

    await expect(page.getByRole('alert')).toBeVisible()
    expect(graphql.sentFor('setUserRole')[0].variables).toEqual({ userId: 2, role: null })
  })

  test('changes nothing where the moderator cancels', async ({ page, graphql }) => {
    await signIn(page, '/user')
    await openTab(page, 0, de.userRole.tabTitle)
    await roleSelect(page).selectOption('ADMIN')
    await details(page).getByRole('button', { name: de.change_user_role }).click()
    await dialog(page).getByRole('button', { name: de.overlay.cancel }).click()

    await expect(dialog(page)).toBeHidden()
    expect(graphql.sentFor('setUserRole')).toEqual([])
  })

  test('goes back to the role before where the change fails', async ({ page, graphql }) => {
    graphql.answer({ setUserRole: new Failure('not allowed') })
    await signIn(page, '/user')
    await openTab(page, 0, de.userRole.tabTitle)
    const select = roleSelect(page)
    await select.selectOption('ADMIN')
    await details(page).getByRole('button', { name: de.change_user_role }).click()
    await dialog(page).getByRole('button', { name: de.overlay.changeUserRole.yes }).click()

    await expect(page.getByRole('alert')).toContainText('not allowed')
    await expect(select).toHaveValue('USER')
  })

  test('saves the main creation group of the member', async ({ page, graphql }) => {
    graphql.answer({ setUserCreationGroups: [creationGroups[1]] })
    await signIn(page, '/user')
    await openTab(page, 0, de.userRole.tabTitle)
    const mainTag = details(page).getByTestId('user-main-tag')
    await expect(mainTag.locator('.dropdown-toggle')).toHaveText('Garten')
    await mainTag.locator('.dropdown-toggle').click()
    await mainTag.getByRole('menuitem', { name: '#bakery' }).click()

    await expect(page.getByRole('alert')).toContainText(de.userRole.savedCreationGroups)
    await expect(mainTag.locator('.dropdown-toggle')).toHaveText('#bakery')
    expect(graphql.sentFor('setUserCreationGroups').map((sent) => sent.variables)).toEqual([
      { userId: 1, tags: ['bakery'] },
    ])
  })

  test('shows and saves the groups a moderator sees', async ({ page, graphql }) => {
    graphql.answer({ setModeratorCreationGroupScope: ({ scope }: Variables) => scope })
    await signIn(page, '/user')
    await openTab(page, 1, de.userRole.tabTitle)
    const scope = details(page).getByTestId('moderator-scope')
    await expect(scope).toHaveValues(['*untagged', 'garden'])
    expect(graphql.sentFor('moderatorCreationGroupScope').at(-1)?.variables).toEqual({ userId: 2 })
    await scope.selectOption(['*all'])

    await expect(page.getByRole('alert')).toContainText(de.userRole.savedScope)
    expect(graphql.sentFor('setModeratorCreationGroupScope').map((sent) => sent.variables)).toEqual(
      [{ userId: 2, scope: ['*all'] }],
    )
  })

  test('shows no scope for a usual member until the moderator role is chosen', async ({
    page,
    graphql,
  }) => {
    await signIn(page, '/user')
    await openTab(page, 0, de.userRole.tabTitle)
    await expect(details(page).getByTestId('user-main-tag')).toBeVisible()
    await expect(details(page).getByTestId('moderator-scope')).toHaveCount(0)
    expect(graphql.sentFor('moderatorCreationGroupScope')).toEqual([])
    await roleSelect(page).selectOption('MODERATOR_AI')

    await expect(details(page).getByTestId('moderator-scope')).toHaveValues(['*untagged', 'garden'])
  })

  test('switches whether the account may create', async ({ page, graphql }) => {
    graphql.answer({ setCreationAllowed: false })
    await signIn(page, '/user')
    await openTab(page, 0, de.userRole.tabTitle)
    const toggle = details(page).getByTestId('creation-allowed-switch')
    await expect(toggle).toBeChecked()
    await toggle.click()

    await expect(page.getByRole('alert')).toContainText(de.userRole.creationAllowed.switchedOff)
    await expect(toggle).not.toBeChecked()
    expect(graphql.sentFor('setCreationAllowed').map((sent) => sent.variables)).toEqual([
      { userId: 1, allowed: false },
    ])
  })

  test('puts the switch back where it fails', async ({ page, graphql }) => {
    graphql.answer({ setCreationAllowed: new Failure('not allowed') })
    await signIn(page, '/user')
    await openTab(page, 0, de.userRole.tabTitle)
    const toggle = details(page).getByTestId('creation-allowed-switch')
    await toggle.click()

    await expect(page.getByRole('alert')).toContainText('not allowed')
    await expect(toggle).toBeChecked()
  })

  test('changes no role of the moderator themselves', async ({ page }) => {
    await signIn(page, '/user')
    await openTab(page, 3, de.userRole.tabTitle)

    await expect(details(page)).toContainText(de.userRole.notChangeYourSelf)
    await expect(roleSelect(page)).toHaveCount(0)
    await expect(details(page).getByTestId('creation-allowed-switch')).toBeVisible()
  })

  test('shows a moderator only whether the account may create', async ({ page, graphql }) => {
    graphql.answer(signedInAnswers(notAnAdmin))
    await signIn(page, '/user', notAnAdmin)
    await openTab(page, 0, de.userRole.tabTitle)

    await expect(details(page).getByTestId('creation-allowed-readonly')).toHaveText(
      `${de.userRole.creationAllowed.label}: ${de.userRole.creationAllowed.yes}`,
    )
    await expect(roleSelect(page)).toHaveCount(0)
    await expect(details(page).getByRole('tab', { name: de.delete_user })).toHaveCount(0)
  })
})

test.describe('deleting', () => {
  test('deletes a member once asked, and shows them deleted', async ({ page, graphql }) => {
    graphql.answer({ deleteUser: '2026-11-09T10:00:00.000Z' })
    await signIn(page, '/user')
    await openTab(page, 0, de.delete_user)
    await details(page).getByRole('button', { name: de.delete_user }).click()

    await expect(dialog(page)).toContainText(
      de.overlay.deleteUser.question.replace('{username}', 'First1 Last1'),
    )
    await dialog(page).getByRole('button', { name: de.overlay.deleteUser.yes }).click()

    await expect(page.getByRole('alert')).toContainText(de.user_deleted)
    expect(graphql.sentFor('deleteUser').map((sent) => sent.variables)).toEqual([{ userId: 1 }])
    await expect(row(page, 0).getByRole('img', { name: de.deleted })).toBeVisible()
    // the pin goes with the account
    await expect(row(page, 0).getByTestId('member-map-pin')).toHaveCount(0)
    await expect(details(page).getByRole('button', { name: de.undelete_user })).toBeVisible()
    await expect(details(page).getByRole('tab', { name: de.e_mail })).toHaveClass(/disabled/)
  })

  test('deletes nobody where the moderator cancels', async ({ page, graphql }) => {
    await signIn(page, '/user')
    await openTab(page, 0, de.delete_user)
    await details(page).getByRole('button', { name: de.delete_user }).click()
    await dialog(page).getByRole('button', { name: de.overlay.cancel }).click()

    await expect(dialog(page)).toBeHidden()
    expect(graphql.sentFor('deleteUser')).toEqual([])
  })

  test('opens a deleted member on the role, and brings them back', async ({ page, graphql }) => {
    graphql.answer({ unDeleteUser: null })
    await signIn(page, '/user')
    await row(page, 2).locator('td').first().click()

    await expect(details(page).getByRole('tab', { selected: true })).toHaveText(
      de.userRole.tabTitle,
    )
    await expect(details(page).getByRole('tab', { name: de.creation, exact: true })).toHaveClass(
      /disabled/,
    )
    await details(page).getByRole('tab', { name: de.delete_user }).click()
    await details(page).getByRole('button', { name: de.undelete_user }).click()
    await dialog(page).getByRole('button', { name: de.overlay.undeleteUser.yes }).click()

    await expect(page.getByRole('alert')).toContainText(de.user_recovered)
    expect(graphql.sentFor('unDeleteUser').map((sent) => sent.variables)).toEqual([{ userId: 3 }])
    await expect(row(page, 2).getByRole('img', { name: de.deleted })).toHaveCount(0)
    await expect(details(page).getByRole('tab', { name: de.e_mail })).not.toHaveClass(/disabled/)
  })

  test('reports a failed deletion', async ({ page, graphql }) => {
    graphql.answer({ deleteUser: new Failure('still has creations') })
    await signIn(page, '/user')
    await openTab(page, 0, de.delete_user)
    await details(page).getByRole('button', { name: de.delete_user }).click()
    await dialog(page).getByRole('button', { name: de.overlay.deleteUser.yes }).click()

    await expect(page.getByRole('alert')).toContainText('still has creations')
    await expect(row(page, 0).getByRole('img', { name: de.deleted })).toHaveCount(0)
  })

  test('deletes not the moderator themselves', async ({ page }) => {
    await signIn(page, '/user')
    await openTab(page, 3, de.delete_user)

    await expect(details(page)).toContainText(de.removeNotSelf)
    await expect(details(page).getByRole('button', { name: de.delete_user })).toHaveCount(0)
  })
})
