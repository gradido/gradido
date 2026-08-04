import {
  CreationGroup as DbCreationGroup,
  UserCreationGroup as DbUserCreationGroup,
} from 'database'
import { In } from 'typeorm'
import { LogError } from '@/server/LogError'

// Group functions: a user's personal creation-group list. The entry with the
// lowest sort order is the user's main tag (pre-filled on submission). Returned as the
// canonical CreationGroup rows, in list order.
export const loadUserCreationGroups = async (userId: number): Promise<DbCreationGroup[]> => {
  const links = await DbUserCreationGroup.find({
    where: { userId },
    order: { sortOrder: 'ASC', id: 'ASC' },
  })
  if (links.length === 0) {
    return []
  }
  const tags = await DbCreationGroup.find({
    where: { id: In(links.map((link) => link.creationGroupId)) },
  })
  const byId = new Map(tags.map((tag) => [tag.id, tag]))
  return links
    .map((link) => byId.get(link.creationGroupId))
    .filter((tag): tag is DbCreationGroup => tag !== undefined)
}

// Replace a user's personal list with the given ordered tags (first = main tag). Tags
// must exist in the canonical creation_groups list; unknown tags are rejected. Duplicates are
// collapsed and order is preserved.
export const saveUserCreationGroups = async (
  userId: number,
  tags: string[],
): Promise<DbCreationGroup[]> => {
  const seen = new Set<string>()
  const normalised: string[] = []
  for (const raw of tags) {
    const tag = raw.trim().replace(/^#+/, '')
    if (tag.length === 0 || /\s/.test(tag)) {
      throw new LogError('Invalid creation group', raw)
    }
    if (!seen.has(tag)) {
      seen.add(tag)
      normalised.push(tag)
    }
  }
  const canonical =
    normalised.length > 0 ? await DbCreationGroup.find({ where: { tag: In(normalised) } }) : []
  // creation_groups.tag is utf8mb4_unicode_ci, so the lookup above already matched regardless of
  // case. Comparing the result against the raw input would reject "Feuerwehr" as unknown
  // while the database just handed back "feuerwehr", so match on the folded spelling.
  const byTag = new Map(canonical.map((tag) => [tag.tag.toLowerCase(), tag]))
  const unknown = normalised.filter((tag) => !byTag.has(tag.toLowerCase()))
  if (unknown.length > 0) {
    throw new LogError('Unknown creation group(s)', unknown.join(', '))
  }
  const links = normalised.map((tag, index) => {
    const canon = byTag.get(tag.toLowerCase())
    if (!canon) {
      throw new LogError('Unknown creation group', tag)
    }
    const link = DbUserCreationGroup.create()
    link.userId = userId
    link.creationGroupId = canon.id
    link.sortOrder = index
    return link
  })
  await DbUserCreationGroup.delete({ userId })
  if (links.length > 0) {
    await DbUserCreationGroup.save(links)
  }
  return loadUserCreationGroups(userId)
}
