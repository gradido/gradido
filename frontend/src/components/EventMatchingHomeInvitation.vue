<!-- AI-GENERATED — not an architecture reference -->
<template>
  <!-- The invitation onto the map after an event link (Bernd, 16.10.2026, KA-015): who came for
       the people of a congress is asked for their home right after the question of the name,
       so that they find the others on the map -- and the first creation waits for the next
       start (useFirstLoginWindow). The look and the two buttons are those of the window behind
       "find on the map" (pages/Matching.vue), the same yes: the home tab with "findable"
       switched on, and the map once it is saved. -->
  <BModal v-model="visible" centered data-test="event-matching-home-invitation">
    <template #title>
      <span style="font-size: 18px">{{ $t('eventMatching.home.title') }}</span>
    </template>
    <template #default>
      <!-- Somebody else's words, the host's: text, never markup. -->
      <p class="mb-0" data-test="event-matching-home-text">
        {{ $t('eventMatching.home.text', { sentence: wholeSentence }) }}
      </p>
    </template>
    <template #footer>
      <!-- One row where both fit; where they do not, the way on stands above "later" -- see
           .window-buttons. -->
      <div class="window-buttons">
        <BButton variant="secondary" data-test="event-matching-home-later" @click="later">
          {{ $t('matching.find.later') }}
        </BButton>
        <BButton variant="gradido" data-test="event-matching-home-show-me" @click="showMe">
          {{ $t('matching.invitation.go') }}
        </BButton>
      </div>
    </template>
  </BModal>
</template>

<script setup>
import { computed, onBeforeUnmount, ref, watch } from 'vue'
import { useStore } from 'vuex'
import { useI18n } from 'vue-i18n'
import { useRoute, useRouter } from 'vue-router'
import { useApolloClient, useMutation } from '@vue/apollo-composable'
import { BButton, BModal } from 'bootstrap-vue-next'
import { eventMatchingArrival } from '@/graphql/queries'
import { settleEventMatchingArrival } from '@/graphql/mutations'
import { eventLinkAnswerUnderway, eventLinkSentence } from '@/composables/useEventMatchingArrival'
import {
  firstLoginWindowOnScreen,
  setFirstLoginWindowUndecided,
  setFirstLoginWindowWanted,
} from '@/composables/useFirstLoginWindow'
import { SHOW_ME_ON_THE_MAP, invitedOntoTheMap } from '@/utils/showMeOnTheMap'
import CONFIG from '@/config'

const store = useStore()
const route = useRoute()
const router = useRouter()
const { t } = useI18n()
const { client } = useApolloClient()
const { mutate: settleMutation } = useMutation(settleEventMatchingArrival)

const member = computed(() => store.state.gradidoID || null)

/**
 * What the account says, after a sign-in: the sentence of the entry the confirmation of a
 * registration through the link made (`eventMatchingArrival`) -- the newcomer whose mail was
 * opened on another device than the link, or long after it, whom nothing on this device can
 * know. `undefined` while it is asked, `null` for no invitation, else the sentence.
 *
 * Asked once for a member who signs in and does not stand on the map -- whoever stands on it
 * has nobody to be invited for, and every round trip costs --, and only on a wallet that has
 * a map: the matching routes, the link and the map exist only there. `network-only`: the query
 * takes no arguments, so a cached answer would be everybody's. And held to the member it was
 * asked for -- a sign-out empties the store while the answer may still be on its way.
 *
 * (An invitation that is due at an account whose member came onto the map without ever being
 * asked -- not possible on the ordinary way, every way onto the map passes a sign-in that asks
 * -- stays at the account unasked, one row; it would be asked again if the member left the map.)
 */
const fromServer = ref(undefined)
watch(
  member,
  async (who) => {
    fromServer.value = undefined
    if (!CONFIG.MATCHING_ACTIVE || !who || !invitedOntoTheMap(store.state)) {
      fromServer.value = null
      return
    }
    let answer = null
    try {
      const { data } = await client.query({
        query: eventMatchingArrival,
        fetchPolicy: 'network-only',
      })
      answer = data?.eventMatchingArrival ?? null
    } catch {
      // Where the server cannot say, there is nobody to invite: the first creation comes as
      // ever, and the invitation, still due at the account, at the next start.
    }
    if (member.value === who) fromServer.value = answer
  },
  { immediate: true },
)

/** The sentence of a link this member opened in this session (Matching.vue made the entry). */
const fromThisSession = eventLinkSentence(member)

const sentence = computed(
  () => fromThisSession.value || (typeof fromServer.value === 'string' ? fromServer.value : null),
)
// As the list of entries and the toast of the link say it: "Ich liebe Kongress …".
const wholeSentence = computed(() =>
  sentence.value ? `${t('matching.type.interesse.prefix')} ${sentence.value}` : '',
)

const dismissed = ref(false)

// Where the window leads to already, it does not stand in the way: the home tab of the entries
// page (/matching/:tab, read off the route's record and not its letters).
const onHomeTab = computed(
  () => route.matched.at(-1)?.path === '/matching/:tab' && route.params?.tab === 'position',
)
// Never over the settings, like the first creation: the windows before this one send members
// there. Not a dismissal -- leaving the settings brings it back.
const onSettings = computed(() => route.path.startsWith('/settings'))

/**
 * Whether there is somebody to invite -- not the same as being on screen (useFirstLoginWindow
 * decides that): a sentence from the link, and a member who does not stand on the map yet, by
 * the one rule the overview's tile asks as well (`invitedOntoTheMap`: a home AND "findable").
 * Whoever stands on it finds the others already.
 */
const wants = computed(
  () =>
    !dismissed.value &&
    Boolean(sentence.value) &&
    invitedOntoTheMap(store.state) &&
    !onSettings.value &&
    !onHomeTab.value,
)
watch(wants, (value) => setFirstLoginWindowWanted('home', value), { immediate: true })
onBeforeUnmount(() => setFirstLoginWindowWanted('home', false))

/**
 * Until both answers are in -- the account's, and that of the entries page for a link opened
 * just now -- nobody knows whether the invitation comes. The windows after it wait meanwhile;
 * the first creation would otherwise take the screen for the moment of the round trip and be
 * pushed off it again.
 */
const undecided = computed(
  () =>
    Boolean(CONFIG.MATCHING_ACTIVE) &&
    Boolean(member.value) &&
    (fromServer.value === undefined || eventLinkAnswerUnderway.value),
)
watch(undecided, (value) => setFirstLoginWindowUndecided('home', value), { immediate: true })
onBeforeUnmount(() => setFirstLoginWindowUndecided('home', false))

const onScreen = firstLoginWindowOnScreen('home')
const visible = computed({
  get: () => onScreen.value,
  set: (open) => {
    // Only the member closing it counts. The getter also goes false when a window before this
    // one takes the screen, and BModal writes that back -- read as an answer, the invitation
    // would be over without having been seen.
    if (!open && onScreen.value) dismissed.value = true
  },
})

/**
 * The account's invitation is over once it has had the screen -- it comes once (KA-015) --, or
 * once it is clear that there is nobody to invite: the member stands on the map by the time
 * the answer is in, or comes onto it in this session another way (the overview's tile, the
 * home tab). Where the entry it was for is gone, the server answers null and names nothing.
 *
 * Said once for each member. Where saying it fails, the invitation comes again at the next
 * start, and with it the first creation waits once more: a cost of one start, not a loss.
 */
let settledFor = null
const settle = async (who) => {
  if (!who || settledFor === who) return
  settledFor = who
  try {
    await settleMutation()
  } catch {
    // See above: it is due again at the next start.
  }
}
watch(onScreen, (shown) => {
  if (shown && typeof fromServer.value === 'string') settle(member.value)
})
watch([fromServer, () => invitedOntoTheMap(store.state)], ([answer, invited]) => {
  if (typeof answer === 'string' && member.value && !invited) settle(member.value)
})

function later() {
  dismissed.value = true
}

function showMe() {
  dismissed.value = true
  router.push(SHOW_ME_ON_THE_MAP)
}
</script>

<style scoped>
/* The footer of the window behind "find on the map" (pages/Matching.vue, `.window-buttons`),
   rule for rule -- the same two buttons, so the same row; EventMatchingHomeInvitation.spec.js
   holds the two copies together. "Mich auf der Karte zeigen" does not fit beside "Später" on
   a phone (buttons of 92 and 317px in a window of 374, measured there at 390px), and a footer
   that wraps the ordinary way would put "later" on a row of its own above the way on.
   wrap-reverse stacks the rows from the bottom, so the way on stands on top. */
.window-buttons {
  display: flex;
  flex: 1 1 0%;
  flex-wrap: wrap-reverse;
  justify-content: flex-end;
  gap: 0.5rem;
  min-width: 0;
}

.window-buttons :deep(.btn-gradido) {
  padding-right: 2rem !important;
  padding-left: 2rem !important;
}

@media (width < 400px) {
  .window-buttons :deep(.btn-gradido) {
    padding-right: 1rem !important;
    padding-left: 1rem !important;
  }
}
</style>
