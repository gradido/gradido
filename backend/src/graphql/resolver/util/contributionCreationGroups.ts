import {
  Contribution as DbContribution,
  ContributionCreationGroup as DbContributionCreationGroup,
  CreationGroup as DbCreationGroup,
} from 'database'
import { In } from 'typeorm'
import { LogError } from '@/server/LogError'

// Group functions: turn what the caller typed into the canonical CreationGroup rows.
//
// Kept apart from the writing on purpose, and that is what makes it safe to call first: a
// rejected tag leaves the contribution exactly as it was, instead of stripping its groups on
// the way to the error.
//
// `strict` decides what happens to a tag that is not in the canonical list. On submission it
// is false on purpose: the field only offers real groups, and a member is not the right
// person to stop over a stale option. Where a MODERATOR moves a contribution, it is true --
// dropping the tag there would empty the group, report success, and take the contribution
// out of every group queue at once. That happened, and only a test caught it.
export const resolveContributionCreationGroups = async (
  tags: string[],
  { strict = false }: { strict?: boolean } = {},
): Promise<DbCreationGroup[]> => {
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
  return canonical
}

// Link a contribution to the groups it belongs to. Writes only -- nothing is cleared first,
// so this alone is right for a row that was just inserted and cannot have links yet. To
// REPLACE the list of an existing contribution, use setContributionCreationGroups.
//
// ⚠️ Whoever calls this instead of setContributionCreationGroups also owes the
// creation_groups_set_at stamp; on a fresh row that belongs on the entity, before the insert.
export const linkContributionCreationGroups = async (
  contributionId: number,
  canonical: DbCreationGroup[],
): Promise<void> => {
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

// Group functions: replace the structured creation groups of an EXISTING contribution.
//
// This also stamps creation_groups_set_at, including when the group is set to "none". That stamp
// is what separates "deliberately no group" from "never said anything", which is the only
// thing the submission pre-fill needs to know.
export const setContributionCreationGroups = async (
  contributionId: number,
  tags: string[],
  { strict = false }: { strict?: boolean } = {},
): Promise<void> => {
  const canonical = await resolveContributionCreationGroups(tags, { strict })
  await DbContributionCreationGroup.delete({ contributionId })
  await DbContribution.update({ id: contributionId }, { creationGroupsSetAt: new Date() })
  await linkContributionCreationGroups(contributionId, canonical)
}
