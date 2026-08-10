// AI-GENERATED — not an architecture reference
import { ref } from 'vue'
import { scoresOf } from '@/components/Matching/displayCore'

/**
 * The seam between the glow map and its data.
 *
 * Right now this serves a stub. Once the GMS routes are merged and reachable,
 * only `load()` below changes — the map component never learns which side it got
 * its people from, so going live swaps the source, not the component.
 *
 * A search, as both sides of this seam mean it:
 *
 *   {
 *     center: { lat, lng },
 *     radius,                            // km
 *     query?: { text, matchingType },    // a question typed instead of stored
 *     mineUuids?: string[],              // my entries, so a match can name the one
 *   }                                    // it answers
 *
 * The centre is the deliberate one, not the map's — panning around is looking,
 * and looking must not search. Both routes take the radius as a required
 * parameter, so the stub demands it too: a stub that answers questions the real
 * thing would refuse teaches the caller a contract that does not exist.
 *
 * `query` is the ad-hoc search: live it is POST /community-user/match-query, which
 * takes the text and the stance and runs exactly one pass of the same chain. When
 * it is set, nothing of mine is consulted — every answer carries a null
 * matchedEntryUuid, because no entry of mine is behind it.
 *
 * A match, as the map AND the detail window want it:
 *
 *   {
 *     uuid:      string,
 *     name:      string,
 *     position:  { lat, lng },        // already blurred by the GMS, never the front door
 *     community: { uuid, name },      // where to reach them — the send form needs it
 *     aboutMe:   string | null,       // their own words; null means they wrote none
 *     channels:  {
 *       interesse?: Entry[],          // every entry they published on that channel,
 *       angebot?:   Entry[],          // not only the ones that answer me
 *       gesuch?:    Entry[],
 *     },
 *     scores:    { interesse?: number[], angebot?: number[], gesuch?: number[] },
 *   }
 *
 *   Entry = { uuid, summary, details: string|null, remote, strength: number|null }
 *
 * Two shapes live here on purpose, because two questions ask different things:
 *
 *   - `scores` is what the MAP reads (via displayCore): one strength per *own*
 *     entry this person answers on a channel. That is what lets breadth ("who
 *     fits more than once") count my needs rather than their offers. It is
 *     derived below from the matched entries, so there is one source of truth.
 *
 *   - `channels` is what the WINDOW reads: the whole person, every entry, matched
 *     or not — because the profile is the person, not the match. A matched entry
 *     carries its `strength`; the rest carry `null`. The window floats the
 *     matches to the top by strength and shows the rest by age.
 *
 * Live, `channels` is the new PROFILE route ("give me person X with all their
 * entries") and the strengths come from the match route, joined by entry uuid —
 * exactly what GMS-111 planned. The map already holds the strengths; the window
 * only needs the full list added.
 *
 * Presence is everyone else in range — on the map they are the grey rings:
 *
 *   { uuid: string, position: { lat, lng }, hasEntries: boolean }
 *
 * ⚠️ The grey rings are NOT clickable yet, and that is deliberate. Opening a
 * profile for one needs three things the GMS backend does not have (GMS-115,
 * Dario's domain): the presence route returns the internal DB id, not a uuid, so
 * there is no key to ask with; the profile route is new; and `hasEntries` is
 * invented here (`index % 3`), it exists nowhere in the backend. Wiring the rings
 * to this stub would build against a fake that asks a question the real thing
 * cannot — the day's lesson. So the window handles the zero-match case (one
 * window, not two — GMS-111), but only the coloured markers open it for now.
 */

/** Great-circle distance in km — the sphere the backend measures on. */
export function distanceKm(a, b) {
  const R = 6371.0088
  const lat1 = (a.lat * Math.PI) / 180
  const lat2 = (b.lat * Math.PI) / 180
  const dLat = lat2 - lat1
  const dLng = ((b.lng - a.lng) * Math.PI) / 180
  const h = Math.sin(dLat / 2) ** 2 + Math.cos(lat1) * Math.cos(lat2) * Math.sin(dLng / 2) ** 2
  return 2 * R * Math.asin(Math.min(1, Math.sqrt(h)))
}

// --- stub ------------------------------------------------------------------
// The strengths are real: they were measured against the seed corpus. The
// people, their places, their words and who answers what are invented — the seed
// only ever ran single searches, so it cannot show one person answering several
// needs, nor the entries that do not match at all. Everything between these two
// markers goes away when the routes go live.

const COMMUNITIES = {
  kuenzelsau: { uuid: 'b6a1f2c0-1111-4a11-8a11-000000000001', name: 'Gradido Künzelsau' },
  hamburg: { uuid: 'b6a1f2c0-2222-4a22-8a22-000000000002', name: 'Gradido Hamburg' },
  berlin: { uuid: 'b6a1f2c0-3333-4a33-8a33-000000000003', name: 'Gradido Berlin' },
}

// An entry is [summary, details|null, strength|null, remote?].
// strength === null means "this person published it, but it does not answer me" —
// it still belongs in their profile. A real number is a match on that channel.
const m = (summary, details, strength, remote = false) => ({ summary, details, strength, remote })

// dLat/dLng place them around the centre; aboutMe is null for the ones who wrote
// none (the window drops the heading rather than accuse them of a gap).
const STUB_PEOPLE = [
  {
    name: 'Marta',
    dLat: 0.042,
    dLng: -0.062,
    community: 'kuenzelsau',
    aboutMe: 'Ich schraube gern an Rädern und helfe, wo ich kann.',
    channels: {
      angebot: [
        m('Fahrradreparatur', 'Alte und neue Räder, auch E-Bikes — ich komme vorbei', 0.4056),
        m('Werkzeug zum Ausleihen', null, null),
      ],
      interesse: [m('Radtouren am Wochenende', null, null)],
    },
  },
  {
    name: 'Ben',
    dLat: -0.038,
    dLng: -0.048,
    community: 'kuenzelsau',
    aboutMe: null,
    channels: {
      angebot: [m('Fahrradwerkstatt', 'Samstags offen, Reparatur gegen Gradido', 0.536)],
    },
  },
  {
    name: 'Kai',
    dLat: 0.021,
    dLng: 0.071,
    community: 'hamburg',
    aboutMe: 'Zweiradmechaniker aus Leidenschaft.',
    channels: {
      angebot: [
        m('Lastenrad-Service', 'Wartung und Reparatur von Lastenrädern', 0.5617),
        m('Laufrad-Aufbau für Kinder', null, null),
      ],
    },
  },
  {
    name: 'Eva',
    dLat: -0.012,
    dLng: 0.083,
    community: 'hamburg',
    aboutMe: 'Ich repariere fast alles, was rollt.',
    channels: {
      angebot: [m('Radreparatur in der Nachbarschaft', null, 0.5324)],
    },
  },
  {
    name: 'Nina',
    dLat: -0.031,
    dLng: 0.034,
    community: 'kuenzelsau',
    aboutMe: null,
    channels: {
      gesuch: [
        m('einen Schlosser', 'Haustür klemmt, alter Schließzylinder', 0.4239),
        m('jemanden fürs Fahrrad', null, null),
      ],
    },
  },
  {
    name: 'Miriam',
    dLat: 0.018,
    dLng: -0.086,
    community: 'berlin',
    aboutMe: 'Musik ist mein Zuhause.',
    channels: {
      interesse: [
        m('Klavier spielen', 'Am liebsten vierhändig, ich suche noch jemanden', 0.8044),
        m('Kammermusik', null, null),
        m('alte Notendrucke', null, null),
      ],
    },
  },
  {
    name: 'Jonas',
    dLat: 0.049,
    dLng: 0.055,
    community: 'berlin',
    aboutMe: null,
    channels: {
      interesse: [m('Klaviermusik', null, 0.6688)],
    },
  },
  // Two channels at once — green + red mix to an orange marker. A rich profile
  // with many interests: the poster child for "the length is the portrait" and
  // the "2 open + X more" drawer.
  {
    name: 'Sofia',
    dLat: 0.036,
    dLng: -0.028,
    community: 'kuenzelsau',
    aboutMe:
      'Ich lebe für Musik und den Garten und freue mich über jede Begegnung, aus der etwas wächst.',
    channels: {
      angebot: [
        m('Klavierunterricht für Kinder', 'Geduldig, spielerisch, bei mir zu Hause', 0.4949),
        m('Notenblätter zum Tauschen', null, null),
      ],
      interesse: [
        m('Permakultur', 'im eigenen Selbstversorgungsgarten', 0.5724),
        m('Chorsingen', null, null),
        m('Imkerei', 'zwei Völker im Garten', null),
        m('Wildkräuter', null, null),
        m('Tonarbeiten', null, null),
        m('Sterne beobachten', null, null),
        m('Aquarellmalerei', null, null),
      ],
    },
  },
  // All three channels — the whole person, a white marker.
  {
    name: 'Otto',
    dLat: -0.008,
    dLng: 0.018,
    community: 'hamburg',
    aboutMe: 'Handwerker, Gärtner, Nachbar.',
    channels: {
      angebot: [m('Fahrradreparatur', 'Ich hole das Rad auch ab', 0.536)],
      gesuch: [m('einen Schlosser', null, 0.4239)],
      interesse: [m('Permakultur', null, 0.8044), m('Kompost und Bokashi', null, null)],
    },
  },
  // Two needs answered — breadth lifts this one a step.
  {
    name: 'Lena',
    dLat: -0.022,
    dLng: -0.074,
    community: 'berlin',
    aboutMe: null,
    channels: {
      angebot: [
        m('Klavierunterricht', 'Für Anfänger jeden Alters', 0.4949),
        m('Notenwart für den Chor', null, 0.4013),
      ],
    },
  },
  // Three needs answered — breadth lifts this one to the top.
  {
    name: 'Max',
    dLat: 0.009,
    dLng: 0.041,
    community: 'kuenzelsau',
    aboutMe: 'Wenn ich helfen kann, sag Bescheid.',
    channels: {
      angebot: [
        m('Fahrradreparatur', null, 0.4056),
        m('Klavierunterricht', 'Auch Hausbesuche', 0.4949),
        m('kleine Schlosserarbeiten', 'Schließzylinder, klemmende Türen', 0.5324),
        m('Anhänger zum Ausleihen', null, null),
      ],
    },
  },
  {
    name: 'Tom',
    dLat: -0.045,
    dLng: 0.078,
    community: 'hamburg',
    aboutMe: null,
    channels: {
      angebot: [m('Chornoten sortieren und pflegen', null, 0.4013)],
    },
  },
  {
    name: 'Anna',
    dLat: 0.058,
    dLng: -0.035,
    community: 'berlin',
    aboutMe: 'Gärtnerin mit einem Faible für alte Sorten.',
    channels: {
      interesse: [
        m('Permakultur', 'Mischkultur und Terra Preta', 0.5724),
        m('Saatgut tauschen', null, null),
      ],
    },
  },
  {
    name: 'Udo',
    dLat: -0.052,
    dLng: 0.012,
    community: 'kuenzelsau',
    aboutMe: null,
    channels: {
      gesuch: [m('einen Schlosser', 'für eine alte Haustür', 0.4239)],
    },
  },
  // --- Zuschnitt 2: two clusters for the pixel-overlap cascade ---------------
  // A house-share on one address (Juri's building): identical coordinates, so no
  // zoom ever separates them — the case that must fall through to the list.
  {
    name: 'Juri',
    dLat: 0.024,
    dLng: 0.02,
    community: 'kuenzelsau',
    aboutMe: 'Ich trage Gradido in unsere Wohnanlage.',
    channels: {
      angebot: [m('Werkzeug zum Ausleihen', 'Bohrmaschine, Leiter, Akkuschrauber', 0.4056)],
    },
  },
  {
    name: 'Mara',
    dLat: 0.024,
    dLng: 0.02,
    community: 'kuenzelsau',
    aboutMe: null,
    channels: {
      gesuch: [m('jemanden fürs Fahrrad', 'die Kette springt immer wieder ab', 0.4239)],
    },
  },
  {
    name: 'Piet',
    dLat: 0.024,
    dLng: 0.02,
    community: 'kuenzelsau',
    aboutMe: null,
    channels: {
      angebot: [m('Klavierunterricht', 'für die Kinder aus dem Haus', 0.4949)],
    },
  },
  {
    name: 'Silke',
    dLat: 0.024,
    dLng: 0.02,
    community: 'kuenzelsau',
    aboutMe: 'Ich koche gern für viele.',
    channels: {
      interesse: [m('Gemeinschaftsgarten', 'im Innenhof der Anlage', 0.5724)],
    },
  },
  // A cluster the blur has spread just enough — near but distinct, so a zoom step
  // or two separates them into single, clickable pins.
  {
    name: 'Rosa',
    dLat: -0.028,
    dLng: 0.052,
    community: 'hamburg',
    aboutMe: null,
    channels: {
      angebot: [m('Lastenrad-Service', null, 0.5617)],
    },
  },
  {
    name: 'Bruno',
    dLat: -0.0262,
    dLng: 0.0538,
    community: 'hamburg',
    aboutMe: null,
    channels: {
      interesse: [m('Klaviermusik', null, 0.6688)],
    },
  },
  {
    name: 'Elif',
    dLat: -0.0299,
    dLng: 0.0508,
    community: 'hamburg',
    aboutMe: null,
    channels: {
      gesuch: [m('einen Schlosser für die Werkstatt', null, 0.4239)],
    },
  },
]

const CHANNELS = ['interesse', 'angebot', 'gesuch']

/** The map reads strengths only: derive them from the matched entries. */
/**
 * Give every entry a stable uuid, so the window can key on it across reloads, and
 * say which entry of MINE it answers.
 *
 * Live that second one comes from the GMS, which knows the pairing because it made
 * it. Here it is handed round the member's real entry uuids in turn - invented, like
 * the people, but enough for the focus lens to have something to narrow to.
 */
function withEntryUuids(channels, personIndex, mineUuids = []) {
  const out = {}
  let taken = personIndex
  for (const channel of CHANNELS) {
    const entries = channels[channel]
    if (!entries || !entries.length) continue
    out[channel] = entries.map((entry, entryIndex) => ({
      uuid: `stub-entry-${personIndex}-${channel}-${entryIndex}`,
      matchedEntryUuid: mineUuids.length ? mineUuids[taken++ % mineUuids.length] : null,
      summary: entry.summary,
      details: entry.details,
      remote: entry.remote,
      strength: entry.strength,
    }))
  }
  return out
}

/** What kind of entry answers mine - the same routing the GMS does. */
const COMPLEMENT = { gesuch: 'angebot', angebot: 'gesuch', interesse: 'interesse' }

/** How many of the asked words this entry carries, summary and details alike. */
function hitsIn(entry, words) {
  const haystack = `${entry.summary} ${entry.details ?? ''}`.toLowerCase()
  return words.filter((word) => haystack.includes(word)).length
}

/**
 * The stub's answer to a typed question.
 *
 * Live, the vector and the reranker do this. Here: keep only the channel the stance
 * asks for, and let crude word overlap stand in for a score - enough to show that a
 * typed question narrows to one channel and ranks by something.
 */
function answerQuery(channels, { text, details, matchingType }) {
  const wanted = COMPLEMENT[matchingType]
  const entries = channels[wanted]
  if (!entries || !entries.length) return {}

  // Summary and particulars are one question, so they are read as one bag of words -
  // the same way the reranker reads stem, summary and details together live.
  const words = `${text} ${details ?? ''}`
    .toLowerCase()
    .split(/\s+/)
    .filter((word) => word.length > 2)
  const scored = entries
    .map((entry) => ({
      ...entry,
      // No entry of mine is behind a typed question - the same null the GMS returns.
      // Without this the focus lens would find answers to entries nobody asked about.
      matchedEntryUuid: null,
      strength: hitsIn(entry, words) ? Math.min(0.95, 0.3 + hitsIn(entry, words) * 0.25) : null,
    }))
    .filter((entry) => entry.strength !== null)

  return scored.length ? { [wanted]: scored } : {}
}

const PRESENCE_COUNT = 240
// Roughly ±55 km by ±66 km around the centre. Wide enough that the radius has
// something to cut: packed into 25 km they would all sit inside the default
// circle, and turning the dial would show nothing happening.
const PRESENCE_SPREAD_LAT = 1.0
const PRESENCE_SPREAD_LNG = 1.8

// stub-only: the presence route returns none of this — no uuid, no name. The list
// needs a name to render a silent row, so we invent one here. Live, this whole
// enrichment waits on the presence route (Dario's domain); until then the silent
// rows show but do not open a profile or a contact, exactly like the grey rings.
const PRESENCE_NAMES = [
  'Lea',
  'Paul',
  'Mia',
  'Finn',
  'Emma',
  'Noah',
  'Lina',
  'Elias',
  'Clara',
  'Jan',
  'Ida',
  'Timo',
  'Ruth',
  'Kurt',
  'Frida',
  'Bela',
  'Nora',
  'Sven',
  'Alma',
  'Ove',
]

/** Deterministic noise, so the stub does not jump around between reloads. */
function wobble(seed) {
  const x = Math.sin(seed * 12.9898) * 43758.5453
  return x - Math.floor(x) - 0.5
}

function stubMatches({ center, radius, query, mineUuids }) {
  return (
    STUB_PEOPLE.map((person, index) => {
      const all = withEntryUuids(person.channels, index, mineUuids)
      // A typed question is asked INSTEAD of my entries: what comes back answers it
      // and nothing else, and no entry of mine is behind any of it.
      const channels = query ? answerQuery(all, query) : all
      return {
        uuid: `stub-match-${index}`,
        name: person.name,
        position: { lat: center.lat + person.dLat, lng: center.lng + person.dLng },
        community: COMMUNITIES[person.community],
        aboutMe: person.aboutMe,
        channels,
        scores: scoresOf(channels),
        // Which precision this person chose to be found at. The map shows everyone
        // alike; the list speaks a distance no finer than this. Live, it comes from
        // the GMS with the position — stubbed here as a mix so the list shows both.
        precision: index % 3 === 0 ? 'ungefaehr' : 'genau',
      }
    })
      .filter((match) => distanceKm(center, match.position) <= radius)
      // A typed question leaves people with nothing to say about it out entirely,
      // rather than carrying them along as matches with no channels.
      .filter((match) => !query || Object.keys(match.channels).length > 0)
  )
}

function stubPresence({ center, radius }) {
  const communities = Object.values(COMMUNITIES)
  return Array.from({ length: PRESENCE_COUNT }, (_, index) => ({
    uuid: `stub-presence-${index}`,
    name: PRESENCE_NAMES[index % PRESENCE_NAMES.length],
    community: communities[index % communities.length],
    precision: index % 2 === 0 ? 'genau' : 'ungefaehr',
    position: {
      lat: center.lat + wobble(index + 1) * PRESENCE_SPREAD_LAT,
      lng: center.lng + wobble(index + 101) * PRESENCE_SPREAD_LNG,
    },
    hasEntries: index % 3 !== 0,
  })).filter((person) => distanceKm(center, person.position) <= radius)
}

// --- end of stub -----------------------------------------------------------

export function useMatches() {
  const matches = ref([])
  const presence = ref([])
  const loading = ref(false)
  const error = ref(null)

  /**
   * @param {object} search
   * @param {{lat: number, lng: number}} search.center where the member chose to search
   * @param {number} search.radius how far out
   * @param {?{text: string, matchingType: string}} [search.query]
   *   a question typed on the spot instead of read from the member's entries
   * @param {string[]} [search.mineUuids] the member's own entry uuids, so a match can
   *   say which of them it answers
   */
  async function load(search) {
    if (!search?.center || !(search.radius > 0)) return
    loading.value = true
    error.value = null
    try {
      matches.value = stubMatches(search)
      presence.value = stubPresence(search)
    } catch (err) {
      error.value = err
      matches.value = []
      presence.value = []
    } finally {
      loading.value = false
    }
  }

  return { matches, presence, loading, error, load }
}
