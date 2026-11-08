// AI-GENERATED — not an architecture reference
import { describe, it, expect } from 'vitest'
import { readFileSync } from 'node:fs'
import { dirname, resolve } from 'node:path'
import { fileURLToPath } from 'node:url'
import { Kind } from 'graphql'
import { queryTransactionLink } from './queries'

/**
 * The sheet of the redeem page and the strip above its account form read the face of the
 * member who made the link off the link itself (`linkData.senderAvatar`, ZE-038). Every spec of
 * those views hands in a made-up link that has the field or has none, so none of them can see
 * whether the page asks for it: with the field gone from the document they all stay green, and
 * no face ever comes.
 *
 * So this holds the files against each other: the views read what the document asks for, on
 * the branch of a member's link -- not on the sender (a User's own `avatar` is for its owner
 * alone), and not on a link from another community, which has no such field.
 */

const here = dirname(fileURLToPath(import.meta.url))
const read = (relativePath) => readFileSync(resolve(here, relativePath), 'utf8')

const branches = queryTransactionLink.definitions
  .find((definition) => definition.kind === Kind.OPERATION_DEFINITION)
  .selectionSet.selections.find((selection) => selection.name.value === 'queryTransactionLink')
  .selectionSet.selections.filter((selection) => selection.kind === Kind.INLINE_FRAGMENT)

/** The fields a branch asks for directly, without what it asks of the objects in it. */
const directFields = (typeName) =>
  branches
    .find((branch) => branch.typeCondition.name.value === typeName)
    .selectionSet.selections.map((selection) => selection.name.value)

/** The fields a branch asks of one object in it. */
const fieldsOf = (typeName, field) =>
  branches
    .find((branch) => branch.typeCondition.name.value === typeName)
    .selectionSet.selections.find((selection) => selection.name.value === field)
    .selectionSet.selections.map((selection) => selection.name.value)

describe('the face of the sender, as the redeem page asks for it', () => {
  it('asks for it on the branch of a member’s link', () => {
    expect(directFields('TransactionLink')).toContain('senderAvatar')
  })

  it('asks for it neither of the sender nor of a link from another community', () => {
    expect(fieldsOf('TransactionLink', 'senderUser')).not.toContain('avatar')
    expect(directFields('RedeemJwtLink')).not.toContain('senderAvatar')
  })

  // The other direction: the two views read the very field the document asks for.
  it.each([
    '../components/LinkInformations/RedeemThanksPaper.vue',
    '../components/LinkInformations/RedeemThanksAccount.vue',
  ])('is what %s reads', (file) => {
    expect(read(file)).toMatch(/linkData\.senderAvatar\b/)
  })
})
