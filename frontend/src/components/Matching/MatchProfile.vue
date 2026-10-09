<!-- AI-GENERATED — not an architecture reference -->
<template>
  <!-- The window is the person's profile: what they published, and nothing else of
       theirs. The match decides what stands open and says why - a dot before each
       entry that matches, and under it the entry of mine it answers (Bernd,
       10.09.2026; GMS-111 had left that out). One window, not two: a grey ring is
       the same window with no open areas. See GMS-111. -->
  <BModal
    :model-value="modelValue"
    :aria-label="match ? $t('matching.profile.aria', { name: match.name }) : ''"
    scrollable
    centered
    body-class="profile-body"
    @update:model-value="emit('update:modelValue', $event)"
  >
    <template #title>
      <div v-if="match" class="profile-head">
        <div class="profile-name">{{ match.name }}</div>
        <div v-if="match.community" class="profile-community">{{ match.community.name }}</div>
      </div>
    </template>

    <div v-if="match">
      <!-- Their own words, first. Not matched, just a text — the most important
           thing about a person is exactly what the machine ignores. Empty means
           empty: the heading falls away rather than accuse them of a gap. -->
      <div v-if="hasAbout" class="profile-about">
        <div class="about-label">{{ $t('matching.tabs.about') }}</div>
        <div class="about-text">{{ match.aboutMe }}</div>
      </div>

      <!-- Heart first: I love · I offer · I look for. The stem is the heading;
           the entries below are only the completions. An empty area is gone. -->
      <div v-for="area in areas" :key="area.key" class="profile-area">
        <button
          type="button"
          class="area-head"
          :aria-expanded="areaOpen[area.key]"
          @click="toggleArea(area.key)"
        >
          <span class="area-dot" :style="{ background: dotColor(area.key) }" aria-hidden="true" />
          <span class="area-stem">{{ $t(`matching.type.${area.key}.prefix`) }}</span>
          <!-- A count, right at the edge (variant B): a rubric tally, never a
               verdict — no percentage, no score is ever shown. -->
          <span class="area-count">{{ area.count }}</span>
          <CollapseIcon :visible="areaOpen[area.key]" />
        </button>

        <BCollapse :model-value="areaOpen[area.key]">
          <ul class="entry-list">
            <li v-for="entry in shownEntries(area)" :key="entry.uuid" class="entry">
              <div class="entry-line">
                <!-- A match wears a dot, drawn by the stylesheet before the sentence
                     (.has-dot): its size, colour and brightness come in as variables. -->
                <span
                  class="entry-summary"
                  :class="{ 'is-match': entry.strength != null, 'has-dot': stageOf(entry) > 0 }"
                  :style="dotStyle(area.key, entry)"
                >
                  {{ entry.summary }}
                </span>
                <span v-if="entry.remote" class="remote-badge">
                  {{ $t('matching.entries.remote') }}
                </span>
              </div>
              <div v-if="entry.details" class="entry-details">{{ entry.details }}</div>
              <!-- Why it matches: each entry of mine it answers, stem and sentence. -->
              <div v-for="mine in entry.matches" :key="mine.uuid" class="entry-mine">
                {{ $t('matching.profile.matchesMine') }}
                <em class="mine-sentence">
                  {{ $t(`matching.type.${displayType(mine.matchingType)}.prefix`) }}
                  {{ mine.summary }}
                </em>
              </div>
            </li>
          </ul>

          <!-- "X more" presupposes a before, so it only appears where something
               already stands open. Over an empty area it would be wrong. -->
          <button
            v-if="!areaExpanded[area.key] && moreCount(area) > 0"
            type="button"
            class="more-btn"
            @click="areaExpanded[area.key] = true"
          >
            {{ $t('matching.profile.more', { n: moreCount(area) }) }}
          </button>
        </BCollapse>
      </div>
    </div>

    <!-- The foot stays put while the profile scrolls. No OK/Cancel: those only closed the
         window, and the × up top already does that.

         A first word, right here (Bernd, 09.10.2026, E-065): for somebody who is no contact yet
         the chat's own compose bar stands in the foot, the words already in its field
         (utils/chatHelloText), and the arrow sends them -- the first chat message of the two,
         which goes by mail and makes them contacts (E-024, KF-012). "Hallo sagen:" stands over
         the words, and the field is drawn as the member's own message is in a conversation --
         gold rim, light gold ground (Bernd after trying it, E-070). The bar's own sentence about
         the first mail is left out here: the line below says afterwards that one went out. It took the place of "send
         an e-mail", which led to the send form's letter: the bar is the same thing, and the
         answer to it arrives in a conversation. The bar has its place from the first moment, so
         the window does not grow under a finger once the server has said who this is -- and
         until then it shows nothing (`helloAsking`): no first word for somebody who may turn out
         to be a contact, and nothing typed that the answer would take away.

         Afterwards the same place says what became of it, in the server's own words (E-034).
         Somebody who is a contact already gets the way into their conversation instead: writing
         into it from here, without seeing it, is not offered.

         "Send Gradido" stays what it was (E-067) -- the window is a go-between, not a till: the
         button points at the send form. Its glyph is the send form's coin. -->
    <template #footer>
      <div v-if="match" class="profile-foot">
        <div
          v-if="helloOffered"
          class="profile-hello-box"
          :class="{ 'is-asking': helloAsking }"
          role="group"
          :aria-labelledby="helloLabelId"
          data-test="profile-hello-box"
        >
          <p :id="helloLabelId" class="profile-hello-label" data-test="profile-hello-label">
            {{ $t('chatHello.say') }}
          </p>
          <chat-compose-bar
            :key="helloKey"
            class="profile-hello"
            :name="match.name"
            first
            :first-note="false"
            text-only
            :sending="helloWaits"
            :failed="helloFailed"
            :initial-text="helloWords"
            data-test="profile-hello"
            @send="sendHello"
          />
        </div>
        <p v-else-if="helloSent" class="profile-hello-sent" data-test="profile-hello-sent">
          <i-mdi-check v-if="helloArrived" class="profile-hello-sent-icon" aria-hidden="true" />
          <span>{{ helloSentWords }}</span>
        </p>

        <div class="profile-actions" :class="{ 'is-single': !conversationOffered }">
          <button
            v-if="conversationOffered"
            ref="conversationButton"
            type="button"
            class="send-btn to-conversation"
            data-test="profile-conversation"
            @click="toConversation"
          >
            <i-mdi-chat-outline class="to-conversation-icon" aria-hidden="true" />
            {{ $t('chatHello.toConversation') }}
          </button>
          <button
            type="button"
            class="send-btn send-gradido"
            data-test="profile-send-gradido"
            @click="toSend"
          >
            <img src="/img/svg/gdd_coin_sw.svg" class="send-coin" alt="" aria-hidden="true" />
            {{ $t('matching.profile.sendGradido') }}
          </button>
        </div>

        <!-- For the ear: what became of the hello. Always in the page, so the words are
             announced when they are put in -- a live region that appears together with its text
             is not. -->
        <p class="visually-hidden" role="status" data-test="profile-hello-status">
          {{ helloSentWords }}
        </p>
      </div>
    </template>
  </BModal>
</template>

<script setup>
import { computed, nextTick, reactive, ref, useId, watch } from 'vue'
import { useI18n } from 'vue-i18n'
import { useRouter } from 'vue-router'
import { useStore } from 'vuex'
import { useApolloClient } from '@vue/apollo-composable'
import ChatComposeBar from '@/components/Chat/ChatComposeBar.vue'
import {
  DEFAULTS,
  LABEL_COLORS,
  displayType,
  scoreToStage,
} from '@/components/Matching/displayCore'
import CollapseIcon from '@/components/TransactionRows/CollapseIcon'
import {
  CHAT_HELLO_ASKING,
  CHAT_HELLO_CONTACT,
  CHAT_HELLO_STRANGER,
  useChatHello,
} from '@/composables/useChatHello'
import { chatHelloDistance, chatHelloSignature, chatHelloText } from '@/utils/chatHelloText'

// Heart first, then offer, then need — GMS-82's "Herz zuerst".
const CHANNEL_ORDER = ['interesse', 'angebot', 'gesuch']
// How many entries stand open in an area at the least; every match stands open beyond
// it, and "X more" folds only the rest (openCount).
const SHOWN = 2
// The dot of a matched entry grows with its step, like the glow on the map, brought
// down to the size of a line of text.
const DOT_SIZE = [8, 9, 10, 12]
// An honest ceiling, not pagination: thirty entries are ~3 KB, so blattering is
// a tool without an opponent — but a runaway list still gets cut, plainly.
const MAX_ENTRIES = 100

const props = defineProps({
  modelValue: { type: Boolean, default: false },
  match: { type: Object, default: null },
  /**
   * The member's own home as the map holds it (`{ lat, lng }`), and how far their standing reach
   * goes, in km: what the hello says about how far apart the two live is measured from the one
   * and kept within the other (utils/chatHelloText). Without them it says nothing about it.
   */
  ownPosition: { type: Object, default: null },
  ownReachKm: { type: Number, default: 0 },
})
const emit = defineEmits(['update:modelValue'])

const router = useRouter()
const store = useStore()
const { t, locale } = useI18n()
const { client: apolloClient } = useApolloClient()

const hasAbout = computed(() => Boolean(props.match?.aboutMe && props.match.aboutMe.trim()))

/** Matches first, strongest on top; then the rest in the order they were kept. */
function sortEntries(entries) {
  const matched = entries.filter((e) => e.strength != null).sort((a, b) => b.strength - a.strength)
  const rest = entries.filter((e) => e.strength == null)
  return [...matched, ...rest]
}

const areas = computed(() => {
  if (!props.match) return []
  const out = []
  for (const key of CHANNEL_ORDER) {
    const entries = props.match.channels?.[key]
    if (!entries || !entries.length) continue
    const matchedCount = entries.filter((e) => e.strength != null).length
    out.push({
      key,
      count: entries.length,
      matchedCount,
      hasMatch: matchedCount > 0,
      sorted: sortEntries(entries),
    })
  }
  return out
})

// An area with a match opens itself; the rest are drawers, shut, their heading
// and count the label. Reset whenever the window changes person.
const areaOpen = reactive({})
const areaExpanded = reactive({})
watch(
  () => props.match,
  () => {
    for (const key of CHANNEL_ORDER) {
      areaOpen[key] = false
      areaExpanded[key] = false
    }
    for (const area of areas.value) areaOpen[area.key] = area.hasMatch
  },
  { immediate: true },
)

function toggleArea(key) {
  areaOpen[key] = !areaOpen[key]
}

function dotColor(key) {
  // The dot wears the colour the member typed the entry in, not the glow's
  // additive primary — so it stays legible for red-green colour vision.
  return LABEL_COLORS[key]
}

/** The step of a matched entry as the map glows it; 0 for anything the map would not draw. */
function stageOf(entry) {
  return scoreToStage(entry.strength)
}

/** What the stylesheet needs to draw the dot of a match; nothing for an entry without one. */
function dotStyle(key, entry) {
  const stage = stageOf(entry)
  if (!stage) return null
  return {
    '--dot-size': `${DOT_SIZE[stage - 1]}px`,
    '--dot-color': dotColor(key),
    '--dot-opacity': DEFAULTS.stageBright[stage - 1],
  }
}

// Everything that matches stands open, and never fewer than SHOWN: a single match stands
// beside the newest of the rest (Bernd, 10.09.2026). Before, the first two stood open
// even when three matched, and the third lay behind "X more".
function openCount(area) {
  return Math.max(SHOWN, area.matchedCount)
}

function shownEntries(area) {
  const capped = area.sorted.slice(0, MAX_ENTRIES)
  return areaExpanded[area.key] ? capped : capped.slice(0, openCount(area))
}

function moreCount(area) {
  return Math.min(area.count, MAX_ENTRIES) - openCount(area)
}

function toSend() {
  const community = props.match?.community?.uuid
  const user = props.match?.uuid
  if (!community || !user) return
  router.push({ path: `/send/${community}/${user}` })
}

/**
 * Whom a first word from here would go to: the person the open window shows, by the pair a chat
 * message is addressed with -- the GMS holds a member under their Gradido ID. Nobody while the
 * window is shut, for a ring without a pair, and for the member's own ring: the map draws the
 * seeker too, and nobody says hello to themselves.
 */
const helloPerson = computed(() => {
  const gradidoID = props.match?.uuid
  const communityUuid = props.match?.community?.uuid
  if (!props.modelValue || !gradidoID || !communityUuid) return null
  const own = String(store.state.gradidoID ?? '').toLowerCase()
  if (own && String(gradidoID).toLowerCase() === own) return null
  return { gradidoID, communityUuid }
})

/**
 * The person as one string. ⛔ The window is handed a new `match` object whenever more of the
 * same person arrives (their entries, the sentences of mine they answer): what is asked and
 * shown here goes by the person, or every such arrival would ask the server again and put the
 * words back over what the member has typed. In lower case: what arrives later comes from
 * another route of the GMS (the profile), and an id spelled otherwise there is the same person.
 */
const helloKey = computed(() =>
  helloPerson.value
    ? `${helloPerson.value.communityUuid}/${helloPerson.value.gradidoID}`.toLowerCase()
    : '',
)

const {
  standing: helloStanding,
  sending: helloSending,
  failed: helloFailed,
  sent: helloSent,
  ask: askHello,
  send: sendHelloWords,
} = useChatHello(apolloClient)

watch(helloKey, () => askHello(helloPerson.value), { immediate: true })

/**
 * The bar stands while a first word can still be written: from the moment the window opens --
 * the server's answer mostly lands while the window is still fading in -- until the hello has
 * gone out, or the server says the two are contacts already. Not where the question did not get
 * through: no first word is offered on a guess.
 */
const helloOffered = computed(
  () =>
    helloPerson.value !== null &&
    helloSent.value === null &&
    (helloStanding.value === CHAT_HELLO_ASKING || helloStanding.value === CHAT_HELLO_STRANGER),
)

/**
 * While the server is asked, the bar keeps its place and shows nothing. The window stands in the
 * middle of the screen: a foot that came with the answer would move the whole window under the
 * finger. But the words are not shown on a guess either -- to somebody who turns out to be a
 * contact they would be wrong, and what was typed into them meanwhile would go with the bar.
 */
const helloAsking = computed(() => helloStanding.value === CHAT_HELLO_ASKING)

/** The arrow waits: for the server's answer about who this is, and while the hello is on its way. */
const helloWaits = computed(() => helloSending.value || helloStanding.value !== CHAT_HELLO_STRANGER)

/**
 * The words in the field. Read by the bar once, when it is made: with the window, each time it
 * opens, and anew for another person (`helloKey`) -- not while the window stays on one person,
 * whatever more of them arrives.
 */
const helloWords = computed(() =>
  chatHelloText(t, {
    name: props.match?.name ?? '',
    signature: chatHelloSignature(store.state.username),
    distance: chatHelloDistance({
      home: props.ownPosition,
      theirs: props.match?.position ?? null,
      reachKm: props.ownReachKm,
    }),
    locale: locale.value,
  }),
)

/**
 * What became of the hello, as the server says it of its copy -- the words the thread uses for
 * the same states, and "gets an e-mail" only where a mail went out (E-034).
 */
const helloSentWords = computed(() => {
  const outcome = helloSent.value
  if (!outcome) return ''
  if (outcome.delivery === 'FAILED') return t('chatThread.failed')
  if (outcome.delivery === 'PENDING') return t('chatThread.pending')
  return outcome.mailed
    ? t('chatHello.sentMailed', { name: props.match?.name ?? '' })
    : t('chatHello.sent')
})

/**
 * The tick before those words: only where the hello went out. "Not delivered" and "not delivered
 * yet" are the server's words for a copy that is stored and did not arrive (E-019) -- a green
 * tick before them would say the opposite.
 */
const helloArrived = computed(
  () =>
    helloSent.value !== null &&
    helloSent.value.delivery !== 'FAILED' &&
    helloSent.value.delivery !== 'PENDING',
)

/** The way into the conversation: once the hello has gone out, and for a contact. */
const conversationOffered = computed(
  () =>
    helloPerson.value !== null &&
    (helloSent.value !== null || helloStanding.value === CHAT_HELLO_CONTACT),
)

const conversationButton = ref(null)

/** What "Hallo sagen:" is found by: it names the group of the words and their arrow. */
const helloLabelId = `${useId()}-hello`

/**
 * The bar asks; the composable sends. Where the bar then gives way to the way into the
 * conversation -- the hello is out, or the server says the two are contacts by now --, whatever
 * held the focus is gone with it: the focus goes to that button, so a keyboard is not left
 * nowhere.
 */
async function sendHello({ body }) {
  await sendHelloWords(body)
  if (helloOffered.value || !conversationOffered.value) return
  await nextTick()
  conversationButton.value?.focus({ preventScroll: true })
}

/**
 * Into the conversation with this person: the address the reply button of a chat mail has
 * (P4c), which the contacts page opens the window for and takes out of the address at once.
 */
function toConversation() {
  const person = helloPerson.value
  if (!person) return
  router.push({
    path: '/contacts',
    query: { with: person.gradidoID, community: person.communityUuid },
  })
}
</script>

<style lang="scss" scoped>
.profile-head {
  min-width: 0;
}

.profile-name {
  font-weight: 700;
  font-size: 18px;
  color: var(--text);
  line-height: 1.2;
}

.profile-community {
  font-size: 13px;
  color: var(--text-muted);
  margin-top: 2px;
}

:deep(.profile-body) {
  padding-top: 0.5rem;
}

.profile-about {
  margin-bottom: 18px;
}

.about-label {
  font-weight: 700;
  font-size: 13px;
  color: var(--text-muted);
  margin-bottom: 4px;
}

.about-text {
  font-size: 15px;
  color: var(--text);
  white-space: pre-wrap;
  word-break: break-word;
}

.profile-area {
  border-top: 1px solid var(--border);
  padding: 4px 0;
}

.area-head {
  display: flex;
  align-items: center;
  gap: 10px;
  width: 100%;
  padding: 8px 0;
  border: 0;
  background: transparent;
  text-align: left;
  color: var(--text);
}

.area-dot {
  width: 12px;
  height: 12px;
  border-radius: 50%;
  flex: 0 0 auto;
}

.area-stem {
  font-weight: 700;
  font-size: 15px;
}

/* Pushed to the right edge, before the collapse chevron — a tally, not a score. */
.area-count {
  margin-left: auto;
  font-size: 14px;
  color: var(--text-muted);
  font-variant-numeric: tabular-nums;
}

/* The chevron is a shared house icon carrying bootstrap's .h1, whose 0.5rem
   margin-bottom lifts it a few pixels above the row centre — just out of line
   with the count beside it. Zero it here (not in the shared component) so the
   arrow and the number sit on one centre line. */
.area-head :deep(.collapse-icon) {
  display: flex;
  align-items: center;
  line-height: 1;
}

.area-head :deep(.collapse-icon svg) {
  margin: 0;
}

.entry-list {
  list-style: none;
  margin: 0;
  padding: 0 0 6px 22px;
}

.entry {
  padding: 6px 0;
}

.entry-line {
  display: flex;
  align-items: baseline;
  flex-wrap: wrap;
  gap: 8px;
}

.entry-summary {
  font-size: 15px;
  color: var(--text);
  word-break: break-word;
}

/* A match reads a shade heavier than the rest of the list. */
.entry-summary.is-match {
  font-weight: 600;
}

/* The dot of a match sits in the list's indent, centred under the area's own dot: a
   12 px column 22 px left of the sentence (the head's 12 px dot and its 10 px gap, which
   is the indent of .entry-list). Its margins and its width add up to nothing, so the
   sentence stays where it is. Drawn before the first letter, so it stays on the first
   line of a long sentence; `middle` centres it on the letters. */
.entry-summary.has-dot::before {
  content: '';
  display: inline-block;
  width: var(--dot-size);
  height: var(--dot-size);
  margin-right: calc(16px - var(--dot-size) / 2);
  margin-left: calc((12px - var(--dot-size)) / 2 - 22px);
  border-radius: 50%;
  background: var(--dot-color);
  opacity: var(--dot-opacity);
  vertical-align: middle;
}

/* Why it matches: my own entry, in the voice of a note - muted, the sentence in
   italics - so the person's own words stay the loudest thing in the window. */
.entry-mine {
  margin-top: 4px;
  font-size: 14px;
  font-weight: 600;
  color: var(--text-muted);
  word-break: break-word;
}

.mine-sentence {
  font-weight: 400;
}

.remote-badge {
  font-size: 12px;
  padding: 2px 9px;
  border-radius: 20px;
  background: var(--surface-muted);
  color: var(--text-muted);
  white-space: nowrap;
}

.entry-details {
  margin-top: 4px;
  padding: 8px 10px;
  border-radius: 12px;
  background: var(--surface-muted);
  font-size: 14px;
  color: var(--text-muted);
  white-space: pre-wrap;
  word-break: break-word;
}

.more-btn {
  margin: 2px 0 8px 22px;
  padding: 0;
  border: 0;
  background: transparent;
  font-size: 14px;
  color: var(--info);
  font-weight: 600;
}

/* The foot, top to bottom: the first word (or what became of it), then the ways out of this
   window. */
.profile-foot {
  display: flex;
  flex-direction: column;
  gap: 10px;
  width: 100%;
  min-width: 0;
}

/* The chat's compose bar, here with no thread above it: the foot of the window already draws
   the line the bar would draw over itself. ⛔ Two classes on purpose: with one, this rule and
   the bar's own (`.chat-compose`) weigh the same, and which of the two wins would be decided by
   where the two stylesheets land in the bundle. */
.profile-foot .profile-hello {
  margin-top: 0;
  padding-top: 0;
  border-top: 0;
}

/* While the server is asked whether the two are contacts: the place is held, nothing is shown --
   "Hallo sagen:" with the bar, or it would stand alone over an empty place. `visibility` takes
   both from the keyboard and from a screen reader as well. */
.profile-hello-box.is-asking {
  visibility: hidden;
}

/* "Hallo sagen:" over the words (Bernd, 09.10.2026, E-070): the window's own small heading, as
   "Über mich" is drawn. */
.profile-hello-label {
  margin: 0 0 6px;
  font-weight: 700;
  font-size: 13px;
  color: var(--text-muted);
}

/* ⛔ The words stand in the field as the member's own message stands in a conversation (Bernd,
   E-070: "identisch ... so wie die Bubble, die ich selber schicke ... mit dem entsprechenden
   Rand und der Hintergrundfarbe"): the bubble's rim, ground and corners, value for value from
   ChatBubble.vue -- MatchProfile.spec holds the two against each other. The gold thinly over
   whatever lies below, so it is light on light and dark on dark, as there.

   Not the bubble's 0.9rem: a field under 16 px makes a phone zoom into the page when it is
   touched (the bar's own rule).

   The focus keeps the bar's green rim: this rule would outweigh it otherwise. */
.profile-foot .profile-hello :deep(.chat-compose-field) {
  border-color: var(--gold, #c58d38);
  border-radius: 1rem;
  border-bottom-right-radius: 0.3rem;
  background: rgb(197 141 56 / 12%);
}

.profile-foot .profile-hello :deep(.chat-compose-field:focus-visible) {
  border-color: var(--success, #047006);
}

/* The hello is words the member sends in their own name: they should be seen whole. At 360 px,
   the commonest width of a phone, they take six lines in five of the ten languages -- one more
   than the bar shows before it scrolls inside. So here the field may be six lines high, where
   the screen has the height for it (the bar's own rule: five lines of 1.4em, the padding, the
   border). */
@media (height >= 640px) {
  .profile-foot .profile-hello :deep(.chat-compose-field) {
    max-height: calc(8.4em + 0.9rem + 2px);
  }
}

/* What became of the hello: a line in the place where the bar stood. */
.profile-hello-sent {
  display: flex;
  align-items: flex-start;
  gap: 8px;
  margin: 0;
  font-size: 15px;
  line-height: 1.4;
  color: var(--text);
}

.profile-hello-sent-icon {
  flex: 0 0 auto;
  width: 1.25em;
  height: 1.25em;
  margin-top: 0.05em;
  color: #178d81;
}

/* ⚠️ `flex-wrap`: the two buttons keep their words on one line, and two long words do not fit
   side by side in every language. Where they do not fit, each takes a row of its own, as under
   421 px. (Measured in ten languages with the larger measure this row had until E-070: "Ouvrir
   la conversation" beside "Envoyer des Gradido" needed a window of 514 px, and between 421 px
   and there the second button stood out of the window.) */
.profile-actions {
  display: flex;
  flex-wrap: wrap;
  gap: 10px;
  width: 100%;
}

/* ⛔ From here to the coin: the contact window's button (ContactWindow.vue), rule for rule and
   in its gold -- "Gradido senden" looks here as it does in the chat (Bernd, 09.10.2026, E-070:
   "das gleiche Gold ... im Prinzip genau so aussehen wie im Chat"). It began the other way
   round: the contact window took this button and swapped the map's teal for the compose bar's
   gold (Bernd, 24.09.2026). ContactWindow.spec holds the three rules against each other. */
.send-btn {
  display: inline-flex;
  align-items: center;
  justify-content: center;
  gap: 8px;
  flex: 1;
  padding: 10px 14px;
  border-radius: 26px;
  font-size: 15px;
  font-weight: 700;
  border: 1.5px solid #c08935;
  white-space: nowrap;
}

.send-gradido {
  background: #c08935;
  color: #fff;
}

/* The coin ships as a dark monochrome glyph; on the gold button it turns white —
   exactly how the send form flips it on its active tab. */
.send-coin {
  width: 20px;
  height: 20px;
  flex: 0 0 auto;
  filter: brightness(0) invert(1);
}

/* Without Bootstrap's `.btn` a plain button has no focus ring of its own: the contact window's
   ring, for both buttons of this row. After a hello sent with the keyboard the focus stands on
   the way into the conversation, and the browser's own ring took the place of the gold rim
   there (seen in the built wallet). */
.send-btn:focus-visible {
  outline: 2px solid var(--success, #047006);
  outline-offset: 2px;
}

/* The way into the conversation beside it: the gold rim of the button's own border, the word
   and its glyph in the window's text colour -- as the chat draws its outlined gold marks
   ("Ankündigung", "In den Kalender"). A word in the gold itself would stand at 3.05 : 1 on the
   light window. */
.to-conversation {
  background: transparent;
  color: var(--text);
}

.to-conversation-icon {
  width: 20px;
  height: 20px;
  flex: 0 0 auto;
}

/* And in the contact window's measure, which is smaller than the rules above (Bernd,
   29.09.2026, there: "nur eine von vielen Optionen"): 14px instead of 15, 7px above and below
   instead of 10, the glyph 18px instead of 20 -- 37px high. MatchProfile.spec holds the numbers
   against ContactWindow.vue. */
.profile-actions .send-btn {
  padding: 7px 14px;
  font-size: 14px;
}

.profile-actions .send-coin,
.profile-actions .to-conversation-icon {
  width: 18px;
  height: 18px;
}

/* One way out alone -- "send Gradido" under the first word -- keeps the width of its word and
   stands at the left: over the whole width it would be the loudest thing in the foot, louder
   than the hello above it. Two ways share the row as they always did. */
.profile-actions.is-single .send-btn {
  flex: 0 1 auto;
  align-self: flex-start;
}

@media (width <= 420px) {
  .profile-actions {
    flex-direction: column;
  }
}
</style>
