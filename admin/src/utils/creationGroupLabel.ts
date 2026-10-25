// AI-GENERATED — not an architecture reference
// Group functions: how a group is written in the ADMIN wherever it is named -- the
// contribution rows, the group dropdowns and the moderator scope form.
//
// By its name alone, as the wallet writes it (frontend/src/utils/creationGroupLabel.js). The
// tag stood beside the name while it was all a group was known by; that is past (Bernd,
// 25.10.2026: the hashtags in the menus "können ersatzlos wegfallen"). The bare "#tag" stays
// for a group without a name -- an old inline hashtag adopted into a group --, which has
// nothing else to be known by. The page of the groups (CreationGroups.tsx) still shows each
// tag: there a group is made and its tag kept.
//
// ⚠️ Written out by hand at five sites until now, which is how the copies started to drift.
// Anything that names a group in the admin belongs here.
//
// The one place that does NOT use this is the adoption dialog's title (CreationGroups.tsx): it
// writes the same form by hand and prints the tag separately on the two lines below.
export type CreationGroup = { name?: string | null; tag: string }

export const creationGroupLabel = (creationGroup: CreationGroup) =>
  creationGroup.name || `#${creationGroup.tag}`

export const creationGroupLabels = (creationGroups: CreationGroup[] | null | undefined) =>
  (creationGroups ?? []).map(creationGroupLabel).join(', ')

// The shape the BFormSelect / ThemedSelect options want. The value is the tag, never the id:
// the whole feature keys on the canonical tag string.
export const creationGroupOption = (creationGroup: CreationGroup) => ({
  value: creationGroup.tag,
  text: creationGroupLabel(creationGroup),
})
