// Group functions: how a group is written in the WALLET wherever it is shown — the
// contribution lists, the selection dropdowns and the community info page. Just the name: on
// a phone "Name (#tag)" is too wide for the double name, and the names are self-explanatory.
// The bare "#tag" stays only as a fallback for an old inline hashtag that has no group name.
// (The admin keeps the tag — there it identifies a mistyped tag on an old contribution — and
// formats its own labels.)
export const groupTagLabel = (groupTag) => groupTag.name || `#${groupTag.tag}`

export const groupTagLabels = (groupTags) => (groupTags ?? []).map(groupTagLabel).join(', ')
