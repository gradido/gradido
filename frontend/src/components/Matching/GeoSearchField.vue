<!-- AI-GENERATED — not an architecture reference -->
<template>
  <div class="geo-search" :class="{ 'is-collapsible': collapsible }">
    <!-- On a map the field hides behind a lens and grows out of it; in the list it
         stands open. That is what leaflet-geosearch's `style: 'button'` did, and the
         list's own field was always the open one (K-010). -->
    <button
      v-if="collapsible"
      type="button"
      class="gk-search-toggle"
      :title="label"
      :aria-label="label"
      :aria-expanded="String(open)"
      :aria-controls="id"
      @click="toggle"
    >
      <svg viewBox="0 0 16 16" width="16" height="16" aria-hidden="true">
        <g fill="none" stroke="currentColor" stroke-width="1.6" stroke-linecap="round">
          <circle cx="7" cy="7" r="4.25" />
          <path d="M10.2 10.2 14 14" />
        </g>
      </svg>
    </button>

    <div v-show="!collapsible || open" class="search-box">
      <input
        :id="id"
        ref="searchInput"
        v-model="query"
        type="text"
        role="combobox"
        autocomplete="off"
        aria-autocomplete="list"
        :aria-expanded="String(results.length > 0)"
        :aria-controls="`${id}-results`"
        :aria-activedescendant="activeResult >= 0 ? `${id}-result-${activeResult}` : null"
        :aria-label="collapsible ? label : null"
        :placeholder="collapsible ? label : null"
        class="search-input"
        @input="onQuery"
        @keydown.down.prevent="moveResult(1)"
        @keydown.up.prevent="moveResult(-1)"
        @keydown.enter.prevent="chooseActive"
        @keydown.esc="closeResults"
      />
      <ul v-if="results.length" :id="`${id}-results`" class="search-results" role="listbox">
        <li
          v-for="(result, index) in results"
          :id="`${id}-result-${index}`"
          :key="result.label + index"
          role="option"
          :aria-selected="String(index === activeResult)"
          class="search-result"
          :class="{ 'is-active': index === activeResult }"
          @mousedown.prevent="choose(index)"
        >
          {{ result.label }}
        </li>
      </ul>
    </div>
  </div>
</template>

<script setup>
import { nextTick, ref } from 'vue'

const props = defineProps({
  // Where the answers come from: `search({ query }) -> Promise<{ lat, lng, label }[]>`.
  // Which service that is behind is the admin switch's business, read per search
  // (utils/geoSearchProvider) - the field never asks.
  provider: { type: Object, required: true },
  // The input's id. The listbox and its options hang off it, and the page that owns
  // a visible <label> points at it.
  id: { type: String, required: true },
  // What this field is for, in words. On a map it names the lens and fills the
  // collapsed field; in the list the page carries a visible label of its own.
  label: { type: String, default: '' },
  // A map wants a lens, a list wants the field itself.
  collapsible: { type: Boolean, default: false },
})

const emit = defineEmits(['pick'])

const searchInput = ref(null)
const open = ref(false)
const query = ref('')
const results = ref([])
const activeResult = ref(-1)
let searchTimer = null
// The number of the search asked for last. A search still out when the member types on, picks
// a place or closes the list must not write its answer afterwards: an older, broader question
// could replace the answer to the newer one, or reopen a list the member has just closed.
let searchRequest = 0

/** Nothing that is waiting or out may write the list any more. */
function stopSearch() {
  if (searchTimer) clearTimeout(searchTimer)
  searchTimer = null
  searchRequest += 1
}

function onQuery() {
  stopSearch()
  const term = query.value.trim()
  if (term.length < 3) {
    results.value = []
    activeResult.value = -1
    return
  }
  const mine = searchRequest
  searchTimer = setTimeout(async () => {
    let found
    try {
      found = (await props.provider.search({ query: term })).slice(0, 6)
    } catch {
      found = []
    }
    if (mine !== searchRequest) return
    results.value = found
    activeResult.value = found.length ? 0 : -1
  }, 300)
}

function moveResult(step) {
  if (!results.value.length) return
  const next = activeResult.value + step
  activeResult.value = (next + results.value.length) % results.value.length
}

function choose(index) {
  const result = results.value[index]
  if (!result) return
  stopSearch()
  // The row itself, not its name searched again: the GMS labels two places the same
  // ("Paris" is France and Texas), so asking for the words would answer with the wrong
  // one. Pass the chosen name up too - the parent names the place without a reverse
  // lookup. The field clears, ready for the next search.
  emit('pick', { lat: result.lat, lng: result.lng, label: result.label })
  query.value = ''
  results.value = []
  activeResult.value = -1
  if (props.collapsible) open.value = false
}

function chooseActive() {
  if (activeResult.value >= 0) choose(activeResult.value)
}

function closeResults() {
  stopSearch()
  results.value = []
  activeResult.value = -1
  // A lens closes with its list: Escape on a map gives the map back, and an open,
  // empty field over it would only be in the way.
  if (props.collapsible) {
    query.value = ''
    open.value = false
  }
}

function toggle() {
  if (open.value) {
    closeResults()
    return
  }
  open.value = true
  // The lens is a way in, so the caret belongs in the field it opens.
  nextTick(() => searchInput.value?.focus())
}
</script>

<style lang="scss" scoped>
.geo-search {
  display: flex;
  align-items: flex-start;
  gap: 4px;
}

/* The lens takes the shape of the map controls it stands with - 34 square with a 2px
   rim and a 4px radius, which is what Leaflet's own bar measures on a touch-capable
   browser, and that is nearly every one. Its colours are the field's (--surface,
   --border); the dark map hands it other ones from outside (MatchingMap). */
.gk-search-toggle {
  flex: none;
  display: flex;
  align-items: center;
  justify-content: center;
  width: 34px;
  height: 34px;
  padding: 0;
  border: 2px solid var(--border);
  border-radius: 4px;
  background: var(--surface);
  background-clip: padding-box;
  color: inherit;
  cursor: pointer;
}

.search-box {
  position: relative;
}

.search-input {
  font: inherit;
  font-size: 14px;
  padding: 6px 10px;
  border: 1.5px solid var(--border);
  border-radius: 8px;
  background: var(--surface);
  color: inherit;
  min-width: 220px;
}

/* Beside the lens the field cannot take its width from the text: hold it to a size
   that still leaves map under it on a phone. Ahead of the two plain rules above in
   weight, so it has to stand after them. */
.geo-search.is-collapsible .search-box {
  width: 220px;
  max-width: 60vw;
}

.geo-search.is-collapsible .search-input {
  width: 100%;
  min-width: 0;
}

.search-results {
  position: absolute;
  z-index: 20;
  top: calc(100% + 2px);
  left: 0;
  right: 0;
  margin: 0;
  padding: 4px;
  list-style: none;
  background: var(--surface);
  border: 1px solid var(--border);
  border-radius: 8px;
  box-shadow: 0 6px 20px rgb(0 0 0 / 18%);
}

.search-result {
  padding: 7px 9px;
  border-radius: 6px;
  font-size: 14px;
  cursor: pointer;

  &.is-active {
    background: rgb(23 141 129 / 12%);
  }
}
</style>
