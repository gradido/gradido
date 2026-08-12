// Group functions: how a group is written in the ADMIN wherever it is named -- the
// contribution rows, the group dropdowns and the moderator scope form.
//
// The admin keeps the tag, unlike the wallet (see frontend/src/utils/creationGroupLabel.js, which
// shows the name alone): here the tag is what identifies a mistyped tag on an old
// contribution, and what a moderator reads when moving one somewhere else.
//
// ⚠️ Written out by hand at five sites until now, which is how the copies started to drift.
// Anything that names a group in the admin belongs here.
//
// The one place that deliberately does NOT use this is the adoption dialog's title
// (CreationGroups.vue): it prints the tag separately on the two lines below, so the long form
// would say it twice.
export const creationGroupLabel = (creationGroup) =>
  creationGroup.name ? `${creationGroup.name} (#${creationGroup.tag})` : `#${creationGroup.tag}`

export const creationGroupLabels = (creationGroups) =>
  (creationGroups ?? []).map(creationGroupLabel).join(', ')

// The shape the BFormSelect / ThemedSelect options want. The value is the tag, never the id:
// the whole feature keys on the canonical tag string.
export const creationGroupOption = (creationGroup) => ({
  value: creationGroup.tag,
  text: creationGroupLabel(creationGroup),
})
