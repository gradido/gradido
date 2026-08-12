import { readonly, ref } from 'vue'

// A tab that was loaded before a deploy keeps the bundle it started with, including the
// GraphQL documents baked into it. Those documents are validated against the schema in full
// before anything runs, so once a field is renamed the whole operation is rejected -- not
// just the part that moved. The member sees a submission that cannot be filed, or a list
// that will not render, and retrying never helps because the bundle never changes.
//
// Reloading fixes it: the server sends index.html as no-store, so a reload always fetches it
// fresh, and it points at the new content-hashed bundle names. The one thing we must not do
// is reload on the member's behalf -- someone who has just typed a contribution would lose
// it. So this only raises a flag, and the bar built on it offers the reload as a button.
//
// ⚠️ Deliberately NOT in the vuex store: that store is persisted to localStorage, and a
// flag that survives the reload it asks for would keep the bar on screen forever.
//
// ⚠️ This file exists twice, once here and once under admin/. That is deliberate, not an
// oversight: the two apps share no package, so there is nowhere to put it that both can
// import. Both copies carry their own tests, which is what keeps them from drifting apart
// unnoticed. If a shared package ever appears, this belongs in it.
const outdated = ref(false)

export const markAppOutdated = () => {
  outdated.value = true
}

// Does this failure mean "your bundle no longer fits the schema"?
//
// Kept here, free of any Apollo import, so it can be tested on its own -- the wiring in
// apolloProvider is then three lines that cannot really be wrong.
//
// ⚠️ Two shapes are accepted on purpose. A validation failure comes back as HTTP 400
// (verified against the running server -- it is NOT a 200 carrying an errors array), and
// whether the client surfaces that as graphQLErrors or as a networkError with the parsed
// body attached is its own affair. Reading only one shape would mean the bar never appears
// after a client upgrade changes that behaviour, and nothing would notice.
//
// Only GRAPHQL_VALIDATION_FAILED counts. An authorisation or business error must not raise
// the bar -- telling someone to reload when reloading cannot help is worse than saying
// nothing. The rare case this over-reports is a genuine bug in a shipped query, which is
// also a mismatch between what the client sends and what the server accepts.
const VALIDATION_FAILED = 'GRAPHQL_VALIDATION_FAILED'

const asList = (value) => (Array.isArray(value) ? value : [])

export const isSchemaMismatch = ({ graphQLErrors, networkError } = {}) => {
  // ⚠️ Both sources are merged, NOT preferred one over the other. `graphQLErrors ?? …` would
  // look right and quietly stop reading the network error whenever graphQLErrors arrives as
  // an empty array rather than as undefined -- which is the client's decision to make, not
  // ours. Concatenating cannot go wrong either way.
  const errors = [...asList(graphQLErrors), ...asList(networkError?.result?.errors)]
  return errors.some((e) => e?.extensions?.code === VALIDATION_FAILED)
}

export function useAppOutdated() {
  return {
    appOutdated: readonly(outdated),
    reloadApp: () => window.location.reload(),
  }
}

// Test seam only. Nothing in the app resets this -- a reload is the reset.
export const resetAppOutdated = () => {
  outdated.value = false
}
