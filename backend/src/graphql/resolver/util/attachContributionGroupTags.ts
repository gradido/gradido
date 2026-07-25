import { ContributionGroupTag as DbContributionGroupTag, GroupTag as DbGroupTag } from 'database'
import { In } from 'typeorm'
import { GroupTag } from '@/graphql/model/GroupTag'

// Everything this needs of a contribution. Typed structurally rather than as the
// Contribution model so callers that only care about the group — the submission
// suggestion, for one — can hand over the three columns instead of building a half-filled
// model. The Contribution model satisfies it as it is.
export interface GroupTaggable {
  id: number
  memo: string
  groupTagsSetAt: Date | null
  groupTags: GroupTag[]
}

// Legacy path: pick the "#word" tokens out of a memo and keep the ones that name a real
// group. Letters (umlauts included), digits, '_' and '-' are tag characters; anything else
// ends the token, so "#feuerwehr," resolves to "feuerwehr".
const INLINE_TAG = /#([\p{L}\p{N}_-]+)/gu

const inlineGroupTags = (memo: string, byTag: Map<string, DbGroupTag>): DbGroupTag[] => {
  const found: DbGroupTag[] = []
  const seen = new Set<number>()
  for (const match of memo.matchAll(INLINE_TAG)) {
    const tag = byTag.get(match[1].toLowerCase())
    if (tag && !seen.has(tag.id)) {
      seen.add(tag.id)
      found.push(tag)
    }
  }
  return found
}

// Group functions: fill in the groups a contribution belongs to, for display.
// Structured links win. The legacy inline "#tag" is resolved against the canonical list
// only where the group was never set through the group field — no link and no
// group_tags_set_at stamp — so older contributions still show their group instead of
// reading "no group", while an assigned one (including one deliberately set to "no group")
// ignores whatever hashtags its memo happens to contain. Same rule as the search filter and
// the moderator scope; the three must not drift apart.
// Batched: two queries for the whole page, not one per contribution.
export const attachContributionGroupTags = async (
  contributions: GroupTaggable[],
): Promise<void> => {
  if (contributions.length === 0) {
    return
  }
  const [links, canonical] = await Promise.all([
    DbContributionGroupTag.find({
      where: { contributionId: In(contributions.map((contribution) => contribution.id)) },
    }),
    DbGroupTag.find({ order: { tag: 'ASC' } }),
  ])
  const byId = new Map(canonical.map((tag) => [tag.id, tag]))
  const byTag = new Map(canonical.map((tag) => [tag.tag.toLowerCase(), tag]))

  const structured = new Map<number, DbGroupTag[]>()
  for (const link of links) {
    const tag = byId.get(link.groupTagId)
    if (!tag) {
      continue
    }
    const list = structured.get(link.contributionId) ?? []
    list.push(tag)
    structured.set(link.contributionId, list)
  }

  for (const contribution of contributions) {
    const own = structured.get(contribution.id)
    const neverAssigned = !own?.length && contribution.groupTagsSetAt === null
    const tags = own?.length ? own : neverAssigned ? inlineGroupTags(contribution.memo, byTag) : []
    contribution.groupTags = tags.map((tag) => new GroupTag(tag))
  }
}
