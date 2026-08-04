import { GroupTag as DbGroupTag, UserGroupTag as DbUserGroupTag } from 'database'
import { In } from 'typeorm'
import { LogError } from '@/server/LogError'

// Group functions: a user's personal group-tag list. The entry with the
// lowest sort order is the user's main tag (pre-filled on submission). Returned as the
// canonical GroupTag rows, in list order.
export const loadUserGroupTags = async (userId: number): Promise<DbGroupTag[]> => {
  const links = await DbUserGroupTag.find({
    where: { userId },
    order: { sortOrder: 'ASC', id: 'ASC' },
  })
  if (links.length === 0) {
    return []
  }
  const tags = await DbGroupTag.find({ where: { id: In(links.map((link) => link.groupTagId)) } })
  const byId = new Map(tags.map((tag) => [tag.id, tag]))
  return links
    .map((link) => byId.get(link.groupTagId))
    .filter((tag): tag is DbGroupTag => tag !== undefined)
}

// Replace a user's personal list with the given ordered tags (first = main tag). Tags
// must exist in the canonical group_tags list; unknown tags are rejected. Duplicates are
// collapsed and order is preserved.
export const saveUserGroupTags = async (userId: number, tags: string[]): Promise<DbGroupTag[]> => {
  const seen = new Set<string>()
  const normalised: string[] = []
  for (const raw of tags) {
    const tag = raw.trim().replace(/^#+/, '')
    if (tag.length === 0 || /\s/.test(tag)) {
      throw new LogError('Invalid group tag', raw)
    }
    if (!seen.has(tag)) {
      seen.add(tag)
      normalised.push(tag)
    }
  }
  const canonical =
    normalised.length > 0 ? await DbGroupTag.find({ where: { tag: In(normalised) } }) : []
  // group_tags.tag is utf8mb4_unicode_ci, so the lookup above already matched regardless of
  // case. Comparing the result against the raw input would reject "Feuerwehr" as unknown
  // while the database just handed back "feuerwehr", so match on the folded spelling.
  const byTag = new Map(canonical.map((tag) => [tag.tag.toLowerCase(), tag]))
  const unknown = normalised.filter((tag) => !byTag.has(tag.toLowerCase()))
  if (unknown.length > 0) {
    throw new LogError('Unknown group tag(s)', unknown.join(', '))
  }
  const links = normalised.map((tag, index) => {
    const canon = byTag.get(tag.toLowerCase())
    if (!canon) {
      throw new LogError('Unknown group tag', tag)
    }
    const link = DbUserGroupTag.create()
    link.userId = userId
    link.groupTagId = canon.id
    link.sortOrder = index
    return link
  })
  await DbUserGroupTag.delete({ userId })
  if (links.length > 0) {
    await DbUserGroupTag.save(links)
  }
  return loadUserGroupTags(userId)
}
