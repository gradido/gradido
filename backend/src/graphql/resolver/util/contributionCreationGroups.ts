import {
  Contribution as DbContribution,
  ContributionCreationGroup as DbContributionCreationGroup,
  CreationGroup as DbCreationGroup,
} from 'database'
import { In } from 'typeorm'
import { LogError } from '@/server/LogError'

// Group functions: set (replace) the structured creation groups of a contribution.
//
// This also stamps creation_groups_set_at, including when the group is set to "none". That stamp
// is what separates "deliberately no group" from "never said anything", which is the only
// thing the submission pre-fill needs to know.
//
// `strict` decides what happens to a tag that is not in the canonical list. On submission it
// is false on purpose: the field only offers real groups, and a member is not the right
// person to stop over a stale option. Where a MODERATOR moves a contribution, it is true --
// dropping the tag there would empty the group, report success, and take the contribution
// out of every group queue at once. That happened, and only a test caught it.
export const setContributionCreationGroups = async (
  contributionId: number,
  tags: string[],
  { strict = false }: { strict?: boolean } = {},
): Promise<void> => {
  const seen = new Set<string>()
  const normalised: string[] = []
  for (const raw of tags) {
    const tag = raw.trim().replace(/^#+/, '')
    if (tag.length === 0 || /\s/.test(tag)) {
      if (strict) {
        throw new LogError('Invalid creation group', raw)
      }
      continue
    }
    if (!seen.has(tag)) {
      seen.add(tag)
      normalised.push(tag)
    }
  }
  // Resolved before anything is written, so a rejected tag leaves the contribution as it was
  // instead of stripping its groups on the way to the error.
  const canonical =
    normalised.length > 0 ? await DbCreationGroup.find({ where: { tag: In(normalised) } }) : []
  if (strict) {
    // creation_groups.tag is utf8mb4_unicode_ci, so the lookup already matched regardless of
    // case; compare on the folded spelling or an existing tag reads as unknown.
    const known = new Set(canonical.map((entry) => entry.tag.toLowerCase()))
    const unknown = normalised.filter((tag) => !known.has(tag.toLowerCase()))
    if (unknown.length > 0) {
      throw new LogError('Unknown creation group(s)', unknown.join(', '))
    }
  }

  await DbContributionCreationGroup.delete({ contributionId })
  await DbContribution.update({ id: contributionId }, { creationGroupsSetAt: new Date() })
  if (canonical.length === 0) {
    return
  }
  await DbContributionCreationGroup.save(
    canonical.map((canon) => {
      const link = DbContributionCreationGroup.create()
      link.contributionId = contributionId
      link.creationGroupId = canon.id
      return link
    }),
  )
}
