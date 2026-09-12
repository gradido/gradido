// AI-GENERATED — not an architecture reference

import { readFileSync } from 'node:fs'
import { dirname, resolve } from 'node:path'
import { fileURLToPath } from 'node:url'
import { describe, expect, it } from 'vitest'

/**
 * ⛔ A field a circle reads but the query never asks for arrives as `undefined` — and every
 * reader downstream treats that as "this member shows no picture". The letters stay, nothing
 * crashes, and no test notices, because the component specs invent their own rows. So this
 * holds the documents against the components instead.
 *
 * ⚠️ A member is named by the PAIR (gradidoID, communityUuid), and the date decides freshness.
 * All three have to be asked for in BOTH places the moderation sees people: the contribution
 * rows and the thread.
 */
const here = dirname(fileURLToPath(import.meta.url))
const read = (relativePath) => readFileSync(resolve(here, relativePath), 'utf8')

describe('what the moderation asks about the people it shows', () => {
  it('asks for the pair and the date on the contribution rows', () => {
    const fragment = read('./fragments.graphql').match(
      /fragment UserCommonFields on User \{([^}]*)\}/,
    )[1]

    // The search proves itself: this is the fragment that carries the member.
    expect(fragment).toContain('alias')
    for (const field of ['gradidoID', 'communityUuid', 'avatarUpdatedAt']) {
      expect(fragment).toContain(field)
    }
  })

  it('asks for the pair and the date on every message of a thread', () => {
    const document = read('./adminListContributionMessages.js')

    expect(document).toContain('userAlias')
    for (const field of [
      'userGradidoID',
      'userCommunityUuid',
      'userAvatarUpdatedAt',
      // The colour of a circle without a picture, as the server computed it (NU-017).
      'userAvatarColorIndex',
    ]) {
      expect(document).toContain(field)
    }
  })

  /**
   * And the other direction: whatever the thread component reads off a message has to be in
   * that document. The row's own fields are covered by the fragment above.
   */
  it('asks for every message field the thread reads', () => {
    const reader = read('../components/ContributionMessages/slots/ContributionMessagesListItem.vue')
    const document = read('./adminListContributionMessages.js')

    const readOffTheMessage = [
      ...new Set([...reader.matchAll(/message\.(user\w+)/g)].map((match) => match[1])),
    ]

    expect(readOffTheMessage.length).toBeGreaterThan(0)
    for (const field of readOffTheMessage) {
      expect(document).toContain(field)
    }
  })
})
