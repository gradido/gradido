import { CreationGroup as DbCreationGroup } from 'database'

// Resolve typed spellings to canonical creation-group rows, letting the DATABASE decide what
// counts as the same spelling.
//
// ⚠️ This is why it does not do one `In([...])` for the whole list and match up the result
// in JavaScript: `creation_groups.tag` is utf8mb4_unicode_ci, which is case- AND
// accent-insensitive, and nothing in JavaScript models that faithfully. `toLowerCase()` gets
// the case half and silently fails the other one -- with the group stored as "Grünwald", an
// input of "Grunwald" comes back from the database as a match and is then rejected by the
// JavaScript map as an unknown group. The member is told a group does not exist that the
// database just handed over.
//
// The price is one lookup per input instead of one for the list. That is affordable here:
// these lists hold a handful of groups, both callers are deliberate write actions rather
// than page renders, and the lookups run together. In exchange there is exactly one
// authority on what "the same group" means, instead of a JavaScript approximation of it.
//
// Returns a map from the spelling as GIVEN to the canonical row, so a caller can keep the
// order it was handed and still write the canonical identity.
export const resolveCreationGroups = async (
  tags: string[],
): Promise<Map<string, DbCreationGroup>> => {
  const found = await Promise.all(
    tags.map(async (tag) => [tag, await DbCreationGroup.findOne({ where: { tag } })] as const),
  )
  const resolved = new Map<string, DbCreationGroup>()
  for (const [tag, row] of found) {
    if (row) {
      resolved.set(tag, row)
    }
  }
  return resolved
}
