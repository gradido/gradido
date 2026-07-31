import { ContributionGroupTag as DbContributionGroupTag, GroupTag as DbGroupTag } from 'database'
import { In } from 'typeorm'
import { GroupTag } from '@/graphql/model/GroupTag'

// Everything this needs of a contribution. Typed structurally rather than as the
// Contribution model so callers that only care about the group can hand over the two
// columns instead of building a half-filled model. The Contribution model satisfies it.
export interface GroupTaggable {
  id: number
  groupTags: GroupTag[]
}

// Group functions: fill in the groups a contribution belongs to, for display.
// A contribution belongs to the groups it is linked to — nothing else. The inline "#tag"
// convention that predates the group field was converted into real links once, in migration
// 0109; a "#word" in a memo is ordinary text from then on.
// Batched: two queries for the whole page, not one per contribution.
export const attachContributionGroupTags = async (
  contributions: GroupTaggable[],
): Promise<void> => {
  if (contributions.length === 0) {
    return
  }
  const links = await DbContributionGroupTag.find({
    where: { contributionId: In(contributions.map((contribution) => contribution.id)) },
  })
  if (links.length === 0) {
    for (const contribution of contributions) {
      contribution.groupTags = []
    }
    return
  }
  const canonical = await DbGroupTag.find({
    where: { id: In(links.map((link) => link.groupTagId)) },
    order: { tag: 'ASC' },
  })
  const byId = new Map(canonical.map((tag) => [tag.id, tag]))

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
    contribution.groupTags = (structured.get(contribution.id) ?? []).map((tag) => new GroupTag(tag))
  }
}
