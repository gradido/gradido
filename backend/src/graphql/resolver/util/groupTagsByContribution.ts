// Group functions: which groups each contribution belongs to, given the link rows and the
// canonical group rows.
//
// Kept apart from attachContributionGroupTags, and free of any `database` import, so it can
// be tested without a database -- the two queries around it are plumbing, this is the part
// that can be wrong.
//
// ⚠️ The sorting lives HERE, per contribution, and used to live on the query instead
// (`order: { tag: 'ASC' }` when loading the canonical rows). There it did nothing: those
// rows go into a Map keyed by id, and the per-contribution list is assembled by walking the
// LINKS, whose query carries no ORDER BY. So the database paid for a sort nobody read, and a
// contribution in several groups was displayed in link-insertion order -- which reaches the
// screen, since neither the wallet nor the admin re-sorts before rendering.

// The least this needs to know about a group row.
interface Taggable {
  id: number
  tag: string
}

interface Link {
  contributionId: number
  groupTagId: number
}

export const groupTagsByContribution = <T extends Taggable>(
  links: Link[],
  canonical: T[],
): Map<number, T[]> => {
  const byId = new Map(canonical.map((tag) => [tag.id, tag]))
  const structured = new Map<number, T[]>()

  for (const link of links) {
    const tag = byId.get(link.groupTagId)
    // A link whose group is gone is skipped rather than rendered as a hole. It cannot
    // happen through the app -- nothing deletes a group -- but the read must not depend on
    // that staying true.
    if (!tag) {
      continue
    }
    const list = structured.get(link.contributionId) ?? []
    list.push(tag)
    structured.set(link.contributionId, list)
  }

  for (const list of structured.values()) {
    list.sort((a, b) => a.tag.localeCompare(b.tag))
  }
  return structured
}
