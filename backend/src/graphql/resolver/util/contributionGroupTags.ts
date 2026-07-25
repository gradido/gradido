import {
  Contribution as DbContribution,
  ContributionGroupTag as DbContributionGroupTag,
  GroupTag as DbGroupTag,
} from 'database'
import { In } from 'typeorm'

// Group functions: set (replace) the structured group tags of a contribution.
// Only tags that exist in the canonical list are stored; unknown or invalid tags are
// ignored (non-blocking on submission — do not scare the user off).
//
// This also stamps group_tags_set_at, including when the group is set to "none": from that
// moment the contribution's group is what the group field says, and any "#word" in the memo
// is ordinary text. Contributions that predate the field carry no stamp and keep resolving
// their inline tag, so the existing stock is unaffected.
export const setContributionGroupTags = async (
  contributionId: number,
  tags: string[],
): Promise<void> => {
  const seen = new Set<string>()
  const normalised: string[] = []
  for (const raw of tags) {
    const tag = raw.trim().replace(/^#+/, '')
    if (tag.length === 0 || /\s/.test(tag)) {
      continue
    }
    if (!seen.has(tag)) {
      seen.add(tag)
      normalised.push(tag)
    }
  }
  await DbContributionGroupTag.delete({ contributionId })
  await DbContribution.update({ id: contributionId }, { groupTagsSetAt: new Date() })
  if (normalised.length === 0) {
    return
  }
  const canonical = await DbGroupTag.find({ where: { tag: In(normalised) } })
  const links = canonical.map((canon) => {
    const link = DbContributionGroupTag.create()
    link.contributionId = contributionId
    link.groupTagId = canon.id
    return link
  })
  if (links.length > 0) {
    await DbContributionGroupTag.save(links)
  }
}
