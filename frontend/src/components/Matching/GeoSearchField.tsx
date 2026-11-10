// AI-GENERATED — not an architecture reference
import { defineComponent, nextTick, type PropType, ref, withKeys, withModifiers } from 'vue'
import classes from './GeoSearchField.module.scss'

/** A place the provider found: where it is, and the words it goes by. */
export type GeoPlace = { lat: number; lng: number; label: string }

/**
 * Where the answers come from: `search({ query }) -> Promise<{ lat, lng, label }[]>`.
 * Which service that is behind is the admin switch's business, read per search
 * (utils/geoSearchProvider) - the field never asks.
 */
export type GeoProvider = { search: (options: { query: string }) => Promise<GeoPlace[]> }

export const GeoSearchField = defineComponent({
  name: 'GeoSearchField',
  props: {
    provider: { type: Object as PropType<GeoProvider>, required: true },
    // The input's id. The listbox and its options hang off it, and the page that owns
    // a visible <label> points at it.
    id: { type: String, required: true },
    // What this field is for, in words. On a map it names the lens and fills the
    // collapsed field; in the list the page carries a visible label of its own.
    label: { type: String, default: '' },
    // A map wants a lens, a list wants the field itself.
    collapsible: { type: Boolean, default: false },
  },
  emits: ['pick'],
  setup(props, { emit }) {
    const searchInput = ref<HTMLInputElement | null>(null)
    const open = ref(false)
    const query = ref('')
    const results = ref<GeoPlace[]>([])
    const activeResult = ref(-1)
    let searchTimer: ReturnType<typeof setTimeout> | null = null
    // The number of the search asked for last. A search still out when the member types on,
    // picks a place or closes the list must not write its answer afterwards: an older, broader
    // question could replace the answer to the newer one, or reopen a list the member has just
    // closed.
    let searchRequest = 0

    /** Nothing that is waiting or out may write the list any more. */
    function stopSearch() {
      if (searchTimer) {
        clearTimeout(searchTimer)
      }
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
        let found: GeoPlace[]
        try {
          found = (await props.provider.search({ query: term })).slice(0, 6)
        } catch {
          found = []
        }
        if (mine !== searchRequest) {
          return
        }
        results.value = found
        activeResult.value = found.length ? 0 : -1
      }, 300)
    }

    function moveResult(step: number) {
      if (!results.value.length) {
        return
      }
      const next = activeResult.value + step
      activeResult.value = (next + results.value.length) % results.value.length
    }

    function choose(index: number) {
      const result = results.value[index]
      if (!result) {
        return
      }
      stopSearch()
      // The row itself, not its name searched again: the GMS labels two places the same
      // ("Paris" is France and Texas), so asking for the words would answer with the wrong
      // one. Pass the chosen name up too - the parent names the place without a reverse
      // lookup. The field clears, ready for the next search.
      emit('pick', { lat: result.lat, lng: result.lng, label: result.label })
      query.value = ''
      results.value = []
      activeResult.value = -1
      if (props.collapsible) {
        open.value = false
      }
    }

    function chooseActive() {
      if (activeResult.value >= 0) {
        choose(activeResult.value)
      }
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

    // The template's four key listeners on one event, each with its own key and modifier,
    // called one after the other as Vue calls a list of listeners.
    const keyListeners: Array<(event: KeyboardEvent) => void> = [
      withKeys(
        withModifiers(() => moveResult(1), ['prevent']),
        ['down'],
      ),
      withKeys(
        withModifiers(() => moveResult(-1), ['prevent']),
        ['up'],
      ),
      withKeys(withModifiers(chooseActive, ['prevent']), ['enter']),
      withKeys(closeResults, ['esc']),
    ]
    const onKeydown = (event: KeyboardEvent) => {
      for (const listener of keyListeners) {
        listener(event)
      }
    }

    const onInput = () => onQuery()

    return () => (
      <div class={['geo-search', classes['geo-search'], { 'is-collapsible': props.collapsible }]}>
        {/* On a map the field hides behind a lens and grows out of it; in the list it
            stands open. That is what leaflet-geosearch's `style: 'button'` did, and the
            list's own field was always the open one (K-010). */}
        {props.collapsible ? (
          <button
            type='button'
            class='gk-search-toggle'
            title={props.label}
            aria-label={props.label}
            aria-expanded={String(open.value) as 'true' | 'false'}
            aria-controls={props.id}
            onClick={toggle}
          >
            <svg viewBox='0 0 16 16' width='16' height='16' aria-hidden='true'>
              <g fill='none' stroke='currentColor' stroke-width='1.6' stroke-linecap='round'>
                <circle cx='7' cy='7' r='4.25' />
                <path d='M10.2 10.2 14 14' />
              </g>
            </svg>
          </button>
        ) : null}

        <div v-show={!props.collapsible || open.value} class='search-box'>
          <input
            id={props.id}
            ref={searchInput}
            v-model={query.value}
            type='text'
            role='combobox'
            autocomplete='off'
            aria-autocomplete='list'
            aria-expanded={String(results.value.length > 0) as 'true' | 'false'}
            aria-controls={`${props.id}-results`}
            aria-activedescendant={
              activeResult.value >= 0 ? `${props.id}-result-${activeResult.value}` : undefined
            }
            aria-label={props.collapsible ? props.label : undefined}
            placeholder={props.collapsible ? props.label : undefined}
            class='search-input'
            onInput={onInput}
            onKeydown={onKeydown}
          />
          {results.value.length ? (
            <ul id={`${props.id}-results`} class='search-results' role='listbox'>
              {results.value.map((result, index) => (
                <li
                  id={`${props.id}-result-${index}`}
                  key={result.label + index}
                  role='option'
                  aria-selected={String(index === activeResult.value) as 'true' | 'false'}
                  class={['search-result', { 'is-active': index === activeResult.value }]}
                  onMousedown={withModifiers(() => choose(index), ['prevent'])}
                >
                  {result.label}
                </li>
              ))}
            </ul>
          ) : null}
        </div>
      </div>
    )
  },
})
