<!-- AI-GENERATED — not an architecture reference -->
<template>
  <!-- The two questions of a video call -- before starting one (V2, V4a, V5, V5b) and before
       joining one from its link in the thread (V4b) -- moved out of the contact window so that a
       group's window asks the same (E-053). Where they stand, the window hands over whom the call
       is with, whether the next message is the first, whether the box is offered, and its
       thread's way out (`deliver`). -->
  <!-- The question before a video call (V2; Notiz §10), after the heart's own (FavoriteHeart):
       no header, the question as the title in the body -- and therefore a name of its own
       (`aria-label`), since `aria-labelledby` is bound only where there is a header.

       A topic, filled in with the default (V4a; Notiz §12): it becomes the meeting's title.
       Still no name field -- a conversation of two. The objection of §10 against a field in
       the question fell because this one is filled in: a click on "Start call" stays one click.

       Its own footer, not BModal's OK: the start button has to open the room's window in the
       click itself (see `startVideoCall`), and it waits with `aria-disabled` while a call is
       being made -- as the compose bar's send button does, so a keyboard that pressed it
       keeps its place. `lazy`, as every dialog here. -->
  <BModal
    v-model="videoAsking"
    lazy
    centered
    no-header
    :aria-label="videoAskTitle"
    data-test="chat-video-dialog"
    @shown="videoAskOpened = true"
  >
    <!-- The gear's view (V5, Bernd, 27.09.2026): the server, and the room's link for people
         outside the thread. In the question's own dialog, in place of its content -- "Back"
         returns to it. The server chosen counts at once and stays, per member on this device
         (chatVideoServer), as the box "Start in the Jitsi app" does. -->
    <template v-if="videoSettings">
      <p class="h5 mb-1" data-test="chat-video-settings-title">
        {{ videoSettingsTitle }}
      </p>
      <p class="small text-muted mb-3" data-test="chat-video-settings-topic">
        {{ $t('chatThread.videoTopicLine', { topic: videoTopicShown }) }}
      </p>
      <div class="mb-3">
        <label class="form-label" :for="videoServerFieldId">
          {{ $t('chatThread.videoServer') }}
        </label>
        <!-- At random, as before, or one of the servers a room is handed out on right now
             (chatVideoServerChoices). -->
        <select
          :id="videoServerFieldId"
          ref="videoServerField"
          v-model="videoServerSelected"
          class="form-select"
          :disabled="videoCalling"
          data-test="chat-video-server"
        >
          <option :value="null">{{ $t('chatThread.videoServerRandom') }}</option>
          <option v-for="choice in videoServerChoices" :key="choice.id" :value="choice.id">
            {{ chatVideoServerLabel(choice) }}
          </option>
        </select>
      </div>
      <!-- The time of a planned call (V5b): a day, from, to -- the browser's own calendar and
           clock, in the member's own time zone, which the line under them names. Empty for
           every question: a day filled in on its own would be a day nobody chose. -->
      <div class="mb-3" role="group" :aria-labelledby="videoWhenLabelId">
        <div :id="videoWhenLabelId" class="form-label">{{ $t('chatThread.videoWhen') }}</div>
        <div class="chat-video-when">
          <div class="chat-video-when-day">
            <label class="small text-muted" :for="videoDayFieldId">
              {{ $t('chatThread.videoDate') }}
            </label>
            <input
              :id="videoDayFieldId"
              v-model="videoDay"
              type="date"
              class="form-control"
              :min="videoToday"
              data-test="chat-video-day"
            />
          </div>
          <div>
            <label class="small text-muted" :for="videoFromFieldId">
              {{ $t('chatThread.videoFrom') }}
            </label>
            <input
              :id="videoFromFieldId"
              v-model="videoFrom"
              type="time"
              step="300"
              class="form-control"
              data-test="chat-video-from"
              @change="fillVideoEnd"
            />
          </div>
          <div>
            <label class="small text-muted" :for="videoToFieldId">
              {{ $t('chatThread.videoTo') }}
            </label>
            <input
              :id="videoToFieldId"
              v-model="videoTo"
              type="time"
              step="300"
              class="form-control"
              data-test="chat-video-to"
            />
          </div>
        </div>
        <div class="small text-muted mt-2" data-test="chat-video-when-hint">
          {{ $t('chatThread.videoWhenHint', { zone: videoZone }) }}
        </div>
      </div>
      <!-- The calendar file of the planned call (V5b), and the whole link, topic and all, for
           people who are not in this thread -- the same room the invitation takes, where the
           call is started or planned from this question. -->
      <div class="chat-video-tools">
        <BButton
          variant="secondary"
          class="chat-video-tool"
          data-test="chat-video-calendar"
          @click="saveVideoCalendar"
        >
          <i-mdi-calendar-plus-outline aria-hidden="true" />
          {{ $t('chatThread.videoCalendarFile') }}
        </BButton>
        <BButton
          variant="secondary"
          class="chat-video-tool"
          data-test="chat-video-copy"
          @click="copyVideoLink"
        >
          <i-mdi-check v-if="videoLinkCopied" aria-hidden="true" />
          <i-mdi-link-variant v-else aria-hidden="true" />
          {{ videoLinkCopied ? $t('chatThread.videoLinkCopied') : $t('chatThread.videoCopyLink') }}
        </BButton>
      </div>
      <div class="small text-muted mt-2">{{ $t('chatThread.videoLinkHint') }}</div>
      <!-- The link that was copied, to be marked and copied by hand where the browser
           refused the clipboard. ⛔ The call's secret: here only while the question is open. -->
      <p v-if="videoLinkShown" class="small mt-1 mb-0 chat-video-link" data-test="chat-video-link">
        {{ videoLinkShown }}
      </p>
      <p v-if="videoProblem" class="mt-3 mb-0" role="alert" data-test="chat-video-settings-problem">
        {{ videoProblem }}
      </p>
      <!-- "Plan" sends the invitation from here (V5b): who gets it, and the box, as in the
           question -- the same box, and the first message goes by mail in any case (E-024). -->
      <p class="mb-0 mt-3 text-muted" data-test="chat-video-plan-body">{{ planBody }}</p>
      <ChatCheck
        v-if="canMail"
        v-model="videoAlsoByEmail"
        class="mt-3"
        box-test="chat-video-plan-email"
      >
        {{ boxWords }}
      </ChatCheck>
    </template>
    <template v-else>
      <p class="h5 mb-2" data-test="chat-video-title">{{ videoAskTitle }}</p>
      <!-- The room went to the Jitsi app, and no sign came that it opened (V4b): the question
         says so and offers the room in the browser (ChatVideoAppMissed). -->
      <ChatVideoAppMissed v-if="videoAppMissed" :room="videoRoomToOpen" />
      <!-- The invitation went out, but the browser held the room's window back (a popup
         blocker): the member opens it from here, by a tap of their own. -->
      <p v-else-if="videoRoomToOpen" class="mb-0">
        <a
          :href="videoRoomToOpen"
          target="_blank"
          rel="noopener noreferrer"
          data-test="chat-video-open"
        >
          {{ $t('chatThread.videoOpen') }}
        </a>
      </p>
      <template v-else>
        <!-- The topic (V4a): it goes into the room's address as Jitsi's own `config.subject` --
           the meeting's title -- and stands in words in the invitation. Filled in anew with the
           default for every question (`askVideoCall`), nothing kept; marked on focus, so typing
           replaces it. The hint under it says who can read the topic, and a screen reader hears
           it with the field (`aria-describedby`).

           ⛔ No focus of its own: the usual case is the one click on "Start call", and on a phone
           the keyboard covered the dialog. Out of the tab order until the question is open
           (`videoAskOpened`), since the dialog's focus trap takes the first stop Tab reaches. -->
        <div class="mb-3">
          <label class="form-label" :for="videoTopicId">
            {{ $t('chatThread.videoTopic') }}
          </label>
          <input
            :id="videoTopicId"
            v-model="videoTopic"
            type="text"
            class="form-control"
            :maxlength="CHAT_VIDEO_TOPIC_MAX"
            autocomplete="off"
            :tabindex="videoAskOpened ? undefined : -1"
            :aria-describedby="videoTopicHintId"
            data-test="chat-video-topic"
            @focus="$event.target.select()"
          />
          <div
            :id="videoTopicHintId"
            class="small text-muted mt-2"
            data-test="chat-video-topic-hint"
          >
            {{ $t('chatThread.videoTopicHint') }}
          </div>
        </div>
        <!-- The first message of a pair goes by mail in any case (E-024; the server sets it),
           so there is nothing to choose, and the sentence says so. After it, the box, empty
           by default -- as under the compose bar. -->
        <p class="mb-0 text-muted" data-test="chat-video-body">{{ askBody }}</p>
        <!-- The server chosen in the gear's view (V5), where it is one to be had right now. -->
        <p
          v-if="videoServer"
          class="small text-muted mt-2 mb-0 chat-video-server"
          data-test="chat-video-server-chosen"
        >
          <i-mdi-server-outline aria-hidden="true" />
          {{ $t('chatThread.videoServerChosen', { host: videoServer.host }) }}
        </p>
        <!-- The compose bar's box (ChatCheck), as every box in this window. -->
        <ChatCheck
          v-if="canMail"
          v-model="videoAlsoByEmail"
          class="mt-3"
          box-test="chat-video-email"
        >
          {{ boxWords }}
        </ChatCheck>
        <!-- `role="alert"`: said when it is put in -- whoever cannot see the dialog would
           otherwise hear nothing after the press. -->
        <p v-if="videoProblem" class="mt-3 mb-0" role="alert" data-test="chat-video-problem">
          {{ videoProblem }}
        </p>
      </template>
    </template>
    <template #footer>
      <!-- "Back" (V5, Bernd, 27.09.2026: "Zurück · Planen"): the choice counts already, so
           there is nothing to take over or to throw away. -->
      <template v-if="videoSettings">
        <BButton variant="secondary" data-test="chat-video-back" @click="closeVideoSettings">
          {{ $t('back') }}
        </BButton>
        <!-- "Plan" (V5b): the invitation with the day and the time into the thread, no room
             opened. It waits while the invitation is on its way, as "Start call" does. -->
        <BButton
          variant="gradido"
          class="chat-video-plan"
          :aria-disabled="videoCalling ? 'true' : 'false'"
          data-test="chat-video-plan"
          @click="planVideoCall"
        >
          {{ $t('chatThread.videoPlan') }}
        </BButton>
      </template>
      <BButton
        v-else-if="videoRoomToOpen"
        variant="secondary"
        data-test="chat-video-close"
        @click="videoAsking = false"
      >
        {{ $t('form.close') }}
      </BButton>
      <template v-else>
        <!-- The gear (V5, Bernd, 27.09.2026), at the left of the two buttons: the server, and
             the link for people outside the thread. Drawn as the camera and the bell are;
             it waits, as the start button does, while a call is being made. -->
        <button
          ref="videoGear"
          type="button"
          class="chat-video-gear"
          :aria-label="$t('chatThread.videoSettings')"
          :title="$t('chatThread.videoSettings')"
          :aria-disabled="videoCalling ? 'true' : 'false'"
          data-test="chat-video-gear"
          @click="openVideoSettings"
        >
          <i-mdi-cog-outline aria-hidden="true" />
        </button>
        <BButton variant="secondary" data-test="chat-video-cancel" @click="videoAsking = false">
          {{ $t('form.cancel') }}
        </BButton>
        <BButton
          variant="gradido"
          class="chat-video-start"
          :aria-disabled="videoCalling ? 'true' : 'false'"
          data-test="chat-video-start"
          @click="startVideoCall"
        >
          {{ $t('chatThread.videoStart') }}
        </BButton>
        <!-- The second way, on a computer only (V4b, chatVideoApp): ticked, "Start call" makes
             the same call and opens the room in the Jitsi app instead of the browser. -->
        <ChatVideoAppBox v-if="offersJitsiApp()" v-model="videoInApp" />
      </template>
    </template>
  </BModal>

  <!-- The question before joining a call (V4b, Bernd, 26.09.2026): a click on the link of a
       video invitation in the thread, on a computer, asks it (ChatMessageText) -- the start's
       question cut short, with no topic and no sentence: the button, and the same box under
       it. Its own footer for the reason the start's has one. -->
  <BModal
    v-model="videoJoining"
    lazy
    centered
    no-header
    :aria-label="videoJoinTitle"
    data-test="chat-video-join-dialog"
  >
    <p class="h5" :class="videoJoinMissed ? 'mb-3' : 'mb-0'" data-test="chat-video-join-title">
      {{ videoJoinTitle }}
    </p>
    <ChatVideoAppMissed v-if="videoJoinMissed" :room="videoJoinRoom" />
    <template #footer>
      <BButton
        v-if="videoJoinMissed"
        variant="secondary"
        data-test="chat-video-join-close"
        @click="videoJoining = false"
      >
        {{ $t('form.close') }}
      </BButton>
      <template v-else>
        <BButton
          variant="secondary"
          data-test="chat-video-join-cancel"
          @click="videoJoining = false"
        >
          {{ $t('form.cancel') }}
        </BButton>
        <BButton
          variant="gradido"
          class="chat-video-join"
          :aria-disabled="videoJoinWaiting ? 'true' : 'false'"
          data-test="chat-video-join"
          @click="joinVideoCall"
        >
          {{ $t('chatThread.videoJoin') }}
        </BButton>
        <ChatVideoAppBox v-if="offersJitsiApp()" v-model="videoInApp" />
      </template>
    </template>
  </BModal>
</template>

<script setup>
import { computed, nextTick, onBeforeUnmount, ref, useId, watch } from 'vue'
import { useI18n } from 'vue-i18n'
import { useStore } from 'vuex'
import { useApolloClient } from '@vue/apollo-composable'
import { BButton, BModal } from 'bootstrap-vue-next'
import ChatCheck from '@/components/Chat/ChatCheck.vue'
import ChatVideoAppBox from '@/components/Chat/ChatVideoAppBox.vue'
import ChatVideoAppMissed from '@/components/Chat/ChatVideoAppMissed.vue'
import { chatVideoRoom, chatVideoServerChoices } from '@/graphql/chat.graphql'
import { chatNotifyFor } from '@/utils/chatNotify'
import { CHAT_VIDEO_TOPIC_MAX, withChatVideoTopic } from '@/utils/chatVideoTopic'
import {
  chatVideoAppUrl,
  offersJitsiApp,
  openInJitsiApp,
  readChatVideoInApp,
  watchJitsiAppOpening,
} from '@/utils/chatVideoApp'
import {
  chatVideoServerLabel,
  isChatVideoServerGone,
  readChatVideoServer,
  rememberChatVideoServer,
} from '@/utils/chatVideoServer'
import {
  chatVideoCalendarFile,
  chatVideoCalendarFileName,
  chatVideoCalendarUid,
  chatVideoDay,
  chatVideoWhen,
  chatVideoZone,
  saveChatVideoCalendarFile,
} from '@/utils/chatVideoCalendar'

const props = defineProps({
  /** Whom the call is with: the person's name, or the group's, as the window shows it. */
  name: { type: String, required: true },
  /**
   * A group's call (E-053): the questions speak of the group, the invitation goes to everybody in
   * it, and the box -- where it is offered -- sends it to all of them by mail, as an announcement.
   */
  group: { type: Boolean, default: false },
  /**
   * Whether the next message is the first of a pair: it goes by mail in any case (E-024), and the
   * questions say so instead of offering the box.
   */
  first: { type: Boolean, default: false },
  /**
   * Whether the questions offer the box that sends the invitation by mail as well -- in a group
   * the owner's and the moderators' only (E-050 F5), and not where nobody else is in it.
   */
  canMail: { type: Boolean, default: false },
  /**
   * The window's way into its thread: sends one message (`{ body, notify }`) and says whether it
   * reached the other side -- the thread's `deliver` (ChatThread).
   */
  deliver: { type: Function, required: true },
})

const { t, d, locale } = useI18n()
const store = useStore()
const { client: apolloClient } = useApolloClient()

/**
 * What the questions say about who gets the invitation, and the box's words. Written-out keys each,
 * for the lint: a person's, or a group's (E-053).
 */
const askBody = computed(() => {
  if (props.group) return t('chatGroup.videoAskBody')
  return props.first
    ? t('chatThread.videoAskFirst', { name: props.name })
    : t('chatThread.videoAskBody', { name: props.name })
})
const planBody = computed(() => {
  if (props.group) return t('chatGroup.videoPlanBody')
  return props.first
    ? t('chatThread.videoPlanFirst', { name: props.name })
    : t('chatThread.videoPlanBody', { name: props.name })
})
const boxWords = computed(() =>
  props.group ? t('chatGroup.videoByEmail') : t('chatThread.alsoByEmail'),
)

/** The question's title, and its name for the ear. */
const videoAskTitle = computed(() =>
  props.group
    ? t('chatGroup.videoAskTitle', { name: props.name })
    : t('chatThread.videoAskTitle', { name: props.name }),
)

/** The question before a call is open. */
const videoAsking = ref(false)
/** The box "Also by e-mail", empty for every question (E-024) -- where it is shown at all. */
const videoAlsoByEmail = ref(false)
/**
 * The topic of the meeting (V4a): the default for every question, and nothing kept -- no store,
 * no log. It travels in the room's address, and the address is the call's secret.
 */
const videoTopic = ref('')
const videoTopicId = `${useId()}-video-topic`
const videoTopicHintId = `${videoTopicId}-hint`
/**
 * Whether the question has finished opening (BModal's `shown`). Until then the topic field is out
 * of the tab order.
 *
 * ⛔ The dialog's focus trap focuses the first element Tab reaches the moment it switches on, and
 * the dialog takes the focus itself only a little later (bootstrap-vue-next 0.26.8). Measured in
 * Chrome, desk and phone: with the field in the tab order it had the focus from 190 ms to 260 ms
 * after the tap -- long enough for a phone to bring up its keyboard over the dialog. Out of it, the
 * trap takes what it took before (the box, or "Cancel"). A tap still focuses the field, and once
 * the question is open Tab reaches it first.
 */
const videoAskOpened = ref(false)
/** A call is being made: the start button waits (`aria-disabled`) and turns a press away. */
const videoCalling = ref(false)
/** Where the call did not come about: the sentence that says so, in the dialog. */
const videoProblem = ref('')
/**
 * The room, where the invitation went out and the browser held its window back: the member
 * opens it from the dialog. So too where the box sent the call to the Jitsi app and the address
 * unexpectedly is none the app takes. ⛔ The address is the call's secret -- it lives here only
 * while the dialog shows it, and in no store (the vuex store is written whole into localStorage)
 * and no log.
 */
const videoRoomToOpen = ref('')
/**
 * The box "Start in the Jitsi app" (V4b, on a computer only), in both questions -- starting a
 * call and joining one: read anew whenever one opens, from what the member left it at on this
 * device, and remembered with every change (ChatVideoAppBox).
 */
const videoInApp = ref(false)
/** The room went to the Jitsi app and no sign came that it opened: the question says so. */
const videoAppMissed = ref(false)
/** Stops watching for the app's sign (`watchJitsiAppOpening`) -- while the question waits. */
let stopVideoAppWatch = null

/**
 * The gear's view (V5, Bernd, 27.09.2026): the server, and the room's link for people outside the
 * thread -- in the question's own dialog, in place of its content, until "Back".
 */
const videoSettings = ref(false)
const videoSettingsTitle = computed(() =>
  props.group
    ? t('chatGroup.videoSettingsTitle', { name: props.name })
    : t('chatThread.videoSettingsTitle', { name: props.name }),
)
const videoServerFieldId = `${videoTopicId}-server`
const videoServerField = ref(null)
const videoGear = ref(null)
/** The topic as the call will carry it: what the field says, or the default. */
const videoTopicShown = computed(() => videoTopic.value.trim() || t('chatThread.videoTopicDefault'))
/** The servers to choose from, as the server named them when the question opened (V5). */
const videoServerChoices = ref([])
/**
 * The server the member chose, by the id of its row -- read from this device when the question
 * opens, remembered at every change (chatVideoServer). null: at random.
 */
const videoServerWanted = ref(null)
/**
 * The chosen server where it is one to be had right now; null where none is chosen, or the one
 * chosen is not among the choices -- then the call goes to a server at random, as before, and the
 * choice stays remembered for when it is back.
 */
const videoServer = computed(
  () => videoServerChoices.value.find((choice) => choice.id === videoServerWanted.value) ?? null,
)
/** The choice as the field shows and changes it. */
const videoServerSelected = computed({
  get: () => videoServer.value?.id ?? null,
  set: (id) => chooseVideoServer(id),
})
/** The list's asking, awaited before a call decides its server; counted against late answers. */
let videoChoicesLoading = Promise.resolve()
let videoChoicesAttempt = 0
/**
 * The room this question asks for, once for the server chosen: `{ serverId, answer, room }` --
 * what "Copy link" copies and "Start call" sends (V5), so that the people the link went to and
 * the person invited meet in the same room. ⛔ The call's secret: here only while the question is
 * open, in no store and no log.
 */
let videoRoomAsked = null
/** The link went to the clipboard. */
const videoLinkCopied = ref(false)
/** The link that was copied, shown under the button. ⛔ The call's secret, as `videoRoomToOpen`. */
const videoLinkShown = ref('')

/**
 * The time of a planned call (V5b): a day and two times of day, as the fields give them -- empty
 * for every question. `videoWhen` is the call's start and end, or null while one is missing or the
 * end is not after the start.
 */
const videoDay = ref('')
const videoFrom = ref('')
const videoTo = ref('')
const videoWhenLabelId = `${videoTopicId}-when`
const videoDayFieldId = `${videoTopicId}-day`
const videoFromFieldId = `${videoTopicId}-from`
const videoToFieldId = `${videoTopicId}-to`
const videoWhen = computed(() => chatVideoWhen(videoDay.value, videoFrom.value, videoTo.value))
/** Today on the member's own calendar: the first day the date field offers. */
const videoToday = computed(() => {
  const now = new Date()
  const pad = (n) => String(n).padStart(2, '0')
  return `${now.getFullYear()}-${pad(now.getMonth() + 1)}-${pad(now.getDate())}`
})
/**
 * The time zone the fields mean, as the member's language names it short (MESZ, CEST): the one of
 * the day chosen -- summer and winter time differ --, or of today while no day is.
 */
const videoZone = computed(() =>
  chatVideoZone(
    videoWhen.value?.start ?? (videoDay.value ? new Date(`${videoDay.value}T12:00`) : new Date()),
    locale.value,
  ),
)

/**
 * The start chosen, and no end yet or an end not after it: the end an hour later, the length most
 * calls have. Changed by hand afterwards, it stays as it is.
 */
const fillVideoEnd = () => {
  const from = videoFrom.value
  if (!from || (videoTo.value && videoTo.value > from)) return
  const [hours, minutes] = from.split(':').map(Number)
  videoTo.value =
    hours >= 23
      ? '23:59'
      : `${String(hours + 1).padStart(2, '0')}:${String(minutes).padStart(2, '0')}`
}

/**
 * The room's window while a call is being made. Given up to the member once it is navigated;
 * closed where the call does not come about, or the question is let go.
 */
let videoRoomWindow = null
/** Counted up with every call made and every question let go: an answer on its way to a
 * question no longer asked changes nothing here. */
let videoAttempt = 0

/**
 * The question, with the box empty and the topic at its default. What the last one ended with
 * went when it was let go.
 */
const askVideoCall = () => {
  videoAlsoByEmail.value = false
  videoTopic.value = t('chatThread.videoTopicDefault')
  videoInApp.value = readChatVideoInApp(store.state.gradidoID)
  videoServerWanted.value = readChatVideoServer(store.state.gradidoID)
  videoServerChoices.value = []
  videoDay.value = ''
  videoFrom.value = ''
  videoTo.value = ''
  videoChoicesLoading = loadVideoServerChoices()
  videoAskOpened.value = false
  videoAsking.value = true
}

/**
 * The servers to choose from (V5), asked afresh for every question: a check every ten minutes
 * may take a server out or bring it back (`network-only`). Where the asking fails there is no
 * choice but "at random", and the call goes as it always went.
 */
const loadVideoServerChoices = async () => {
  videoChoicesAttempt += 1
  const attempt = videoChoicesAttempt
  try {
    const { data } = await apolloClient.query({
      query: chatVideoServerChoices,
      fetchPolicy: 'network-only',
    })
    if (attempt === videoChoicesAttempt) {
      videoServerChoices.value = data?.chatVideoServerChoices ?? []
    }
  } catch {
    // No list: "at random" only.
  }
}

/**
 * A server chosen in the gear's view: it counts at once, and stays remembered for this member on
 * this device (Bernd, 27.09.2026: "Zurück · Planen", no "Take over"). Another server is another
 * room -- a link copied for the last one is not this one's, so it goes, and the room for the new
 * choice is asked for at once (see `copyVideoLink`).
 *
 * ⛔ A "Copy link" still waiting for the last server's room lets go as well (`videoAttempt`):
 * copied late, it would put the last server's room on the clipboard while the new one is shown,
 * and the call would then go to another room than the link (coderabbit, #3994). No call can be on
 * its way here -- the gear's view is not opened while one is.
 */
const chooseVideoServer = (id) => {
  videoAttempt += 1
  videoServerWanted.value = id
  rememberChatVideoServer(store.state.gradidoID, id)
  videoRoomAsked = null
  videoLinkCopied.value = false
  videoLinkShown.value = ''
  videoProblem.value = ''
  askVideoRoom()
}

/**
 * The room for this question (V5): asked once for the server chosen, and taken by "Copy link" and
 * "Start call" alike. Asked anew where the choice changed since, or where the last asking brought
 * no room. Without a server chosen the query goes without `serverId` -- at random, as before.
 *
 * ⛔ Asked with `no-cache`: every answer is another room, and one out of the cache would put two
 * conversations into the same room (chat.graphql).
 */
const askVideoRoom = () => {
  const serverId = videoServer.value?.id ?? null
  if (videoRoomAsked?.serverId === serverId) return videoRoomAsked.answer
  const asked = { serverId, answer: null, room: null }
  // In a promise of its own, so that whatever goes wrong in the asking comes back as the answer,
  // as it did where the start awaited the query in a `try`.
  asked.answer = new Promise((resolve) =>
    resolve(
      apolloClient.query({
        query: chatVideoRoom,
        ...(serverId ? { variables: { serverId } } : {}),
        fetchPolicy: 'no-cache',
      }),
    ),
  )
    .then(({ data }) => ({ room: data?.chatVideoRoom ?? null, error: null }))
    .catch((error) => ({ room: null, error }))
    .then((answer) => {
      if (answer.room) {
        asked.room = answer.room
      } else if (videoRoomAsked === asked) {
        videoRoomAsked = null
      }
      return answer
    })
  videoRoomAsked = asked
  return asked.answer
}

/** What the question says where no room came: the chosen server gone, none at all, or else. */
const videoRoomProblem = (error, otherwise) => {
  if (isChatVideoServerGone(error)) return t('chatThread.videoServerGone')
  if (isNoVideoServer(error)) return t('chatThread.videoNoServer')
  return otherwise
}

/**
 * The gear: its view in place of the question's content. The room is asked for right away (for
 * the server chosen, once the list is in), so that "Copy link" finds it ready in the click. It
 * waits, as the start button does, while a call is being made.
 */
const openVideoSettings = () => {
  if (videoCalling.value) return
  videoProblem.value = ''
  videoSettings.value = true
  videoChoicesLoading.then(() => {
    if (videoSettings.value) askVideoRoom()
  })
  nextTick(() => videoServerField.value?.focus())
}

/** "Back": the question again, the choice as it now stands; the gear gets the focus back. */
const closeVideoSettings = () => {
  videoSettings.value = false
  videoProblem.value = ''
  nextTick(() => videoGear.value?.focus())
}

/**
 * "Copy link" (V5): the room's whole address, topic and all, for people outside the thread --
 * the room the invitation takes where the call is started from this question. It is shown under
 * the button as well, to be marked and copied by hand where the browser refuses the clipboard.
 *
 * ⛔ The clipboard is written in the click itself where the room is in already, as it is once the
 * gear's view has asked for it: a browser writes to the clipboard in answer to a tap, and Safari
 * does not count a write that comes after a round trip as one. Only where the room is not in yet
 * is it awaited here.
 */
const copyVideoLink = async () => {
  if (videoCalling.value) return
  const attempt = videoAttempt
  videoProblem.value = ''
  const serverId = videoServer.value?.id ?? null
  let room = videoRoomAsked?.serverId === serverId ? videoRoomAsked.room : null
  if (!room) {
    // The server chosen is known once the list is in (V5): a press before that waits for it, as
    // "Start call" and "Plan" do -- else the link would name a room at random and the invitation
    // then another one (coderabbit, #4015). A room already in is copied in the click, above.
    await videoChoicesLoading
    if (attempt !== videoAttempt) return
    const answer = await askVideoRoom()
    if (attempt !== videoAttempt) return
    if (!answer.room) {
      videoProblem.value = videoRoomProblem(answer.error, t('chatThread.videoNoServer'))
      return
    }
    room = answer.room
  }
  const link = withChatVideoTopic(room.url, videoTopicShown.value)
  videoLinkShown.value = link
  videoLinkCopied.value = false
  try {
    await navigator.clipboard.writeText(link)
    if (attempt === videoAttempt) videoLinkCopied.value = true
  } catch {
    // Refused, or no clipboard at all: the link stands under the button.
  }
}

/**
 * The invitation to a planned call (V5b), as the thread and the mail get it: the room with its
 * topic and its time (`withChatVideoTopic`), the day and the time in words in the sender's language
 * and time zone -- the zone named, since the one invited may live in another --, and who runs the
 * server. Two written-out keys, as for the call now (see `startVideoCall`).
 */
const plannedVideoInvitation = (offered, topic, when) => {
  const url = withChatVideoTopic(offered.url, topic, when)
  const operator = offered.operator ?? offered.host
  const date = chatVideoDay(when.start, locale.value)
  const time = t('chatThread.videoPlannedTime', {
    from: d(when.start, 'time'),
    to: d(when.end, 'time'),
    zone: chatVideoZone(when.start, locale.value),
  })
  const body =
    topic === t('chatThread.videoTopicDefault')
      ? t('chatThread.videoInvitePlanned', { date, time, operator, url })
      : t('chatThread.videoInvitePlannedTopic', { topic, date, time, operator, url })
  return { url, body }
}

/**
 * "Calendar file" (V5b): the planned call as an iCalendar file, for the member's own calendar --
 * the room this question takes, the invitation as its note. Nothing is sent.
 */
const saveVideoCalendar = async () => {
  if (videoCalling.value) return
  const when = videoWhen.value
  videoProblem.value = ''
  if (!when) {
    videoProblem.value = t('chatThread.videoPlanIncomplete')
    return
  }
  const attempt = videoAttempt
  const topic = videoTopicShown.value
  // The server chosen, once the list is in -- as "Copy link" (coderabbit, #4015).
  await videoChoicesLoading
  if (attempt !== videoAttempt) return
  const { room: offered, error } = await askVideoRoom()
  if (attempt !== videoAttempt) return
  if (!offered) {
    videoProblem.value = videoRoomProblem(error, t('chatThread.videoNoServer'))
    return
  }
  const { url, body } = plannedVideoInvitation(offered, topic, when)
  saveChatVideoCalendarFile(
    chatVideoCalendarFileName(topic, when.start),
    chatVideoCalendarFile({
      start: when.start,
      end: when.end,
      title: `${topic} – ${props.name}`,
      description: body,
      url,
      uid: chatVideoCalendarUid(offered.url, when.start),
    }),
  )
}

/**
 * "Plan" (V5b, Bernd, 27.09.2026: "Bei Planen werden dann die Sitzungsdaten in die Chat-Bubble
 * eingetragen"): the invitation with the day and the time into the thread -- on the server chosen,
 * in the room a copied link already went out for --, and the question closes. No room is opened:
 * the call is later, and its link in the thread opens it then.
 *
 * ⚠️ No new attempt, unlike "Start call": a "Copy link" or a "Calendar file" pressed just before
 * is the member's own, for the same room -- the server field waits while the plan is on its way --,
 * and finishes. Only letting the question go lets go of the plan.
 */
const planVideoCall = async () => {
  if (videoCalling.value) return
  const when = videoWhen.value
  videoProblem.value = ''
  if (!when) {
    videoProblem.value = t('chatThread.videoPlanIncomplete')
    return
  }
  const attempt = videoAttempt
  const through = props.deliver
  const notify = chatNotifyFor({
    first: props.first,
    alsoByEmail: videoAlsoByEmail.value,
  })
  const topic = videoTopicShown.value
  videoCalling.value = true
  await videoChoicesLoading
  if (attempt !== videoAttempt) return
  const { room: offered, error } = await askVideoRoom()
  if (attempt !== videoAttempt) return
  const delivered =
    offered && through
      ? await through({ body: plannedVideoInvitation(offered, topic, when).body, notify })
      : false
  if (attempt !== videoAttempt) return
  videoCalling.value = false
  if (!delivered) {
    videoProblem.value = videoRoomProblem(error, t('chatThread.videoNotSent'))
    return
  }
  videoAsking.value = false
}

/**
 * The question let go -- cancelled, closed, or the window came to somebody else. A window opened
 * for a room that did not come about is closed again, and nothing still on its way is taken up.
 * ⚠️ An invitation already on its way cannot be called back: it lands in the thread like any
 * message, only no room opens for it.
 */
const forgetVideoCall = () => {
  videoAttempt += 1
  videoRoomWindow?.close()
  videoRoomWindow = null
  videoCalling.value = false
  videoProblem.value = ''
  videoRoomToOpen.value = ''
  stopVideoAppWatch?.()
  stopVideoAppWatch = null
  videoAppMissed.value = false
  videoSettings.value = false
  videoRoomAsked = null
  videoLinkCopied.value = false
  videoLinkShown.value = ''
}

watch(videoAsking, (open) => {
  if (!open) forgetVideoCall()
})

/** Whether the server said that no video server is to be had right now (V1). */
const isNoVideoServer = (error) => String(error?.message ?? '').includes('CHAT_VIDEO_NO_SERVER')

/**
 * "Start call": a room from the server, the invitation into the thread, the room in a window of
 * its own -- in this order (V2).
 *
 * ⛔ The window is opened FIRST, in the click itself, before anything is awaited: a browser lets
 * a page open a window only in answer to a tap, and a window opened after the round trips would
 * be held back by the popup blocker. It stays empty until the invitation went out -- a room that
 * nobody else knows is not entered -- and is closed where the call does not come about.
 * ⚠️ `opener` is cut by hand rather than with `noopener`: with it `window.open` returns null,
 * and a window one has no hold of cannot be sent to the room afterwards. Cut, the room's page
 * has no `window.opener` to reach back into the wallet by. What the server of the room does
 * learn is the wallet's origin, as the referrer of this one navigation (the browser's default
 * policy); the link in the thread, and the one in the dialog, carry none (`noreferrer`).
 *
 * ⛔ The room is asked for with `no-cache`: every answer is another room, and one out of the
 * cache would put two conversations into the same room (chat.graphql).
 *
 * The invitation is written in the sender's language and stays so -- an ordinary chat message,
 * the address at its very end, with a space before it and nothing after, so the thread's link
 * finder takes it whole (chatTextParts). Who runs the server is named in it; where the list names
 * nobody, the server's host. It goes through the thread (`deliver`), which hangs it under the
 * conversation, says "sent" for the ear, and holds the compose bar while it is on its way.
 *
 * The topic (V4a) is taken in the click, as the box is: what the field says at the press is the
 * call's topic, whatever is typed while the call is on its way. An emptied field is the default
 * -- the address never goes without its addition, which is what will mark it as a video
 * invitation (V4b). The address with the topic is made once, and the invitation, the room's
 * window and the link in the dialog all carry that one.
 *
 * With the box "Start in the Jitsi app" ticked (V4b, on a computer only) it is the same call
 * without the window: the room, the invitation through the thread, the same words for what went
 * wrong -- and once the invitation went out, the room is handed to the app (`openInJitsiApp`) and
 * the question closes. Not in the click, for the same reason the window waits empty: a room that
 * nobody else knows is not entered.
 */
const startVideoCall = async () => {
  if (videoCalling.value) return
  const inApp = offersJitsiApp() && videoInApp.value
  const room = inApp ? null : window.open('', '_blank')
  if (room) room.opener = null
  videoRoomWindow = room
  videoAttempt += 1
  const attempt = videoAttempt
  const through = props.deliver
  const notify = chatNotifyFor({
    first: props.first,
    alsoByEmail: videoAlsoByEmail.value,
  })
  const topicDefault = t('chatThread.videoTopicDefault')
  const topic = videoTopic.value.trim() || topicDefault
  videoCalling.value = true
  videoProblem.value = ''

  // The server chosen (V5) is known once the list is in: a press before that still goes to it.
  await videoChoicesLoading
  if (attempt !== videoAttempt) return
  const { room: offered, error: roomError } = await askVideoRoom()
  if (attempt !== videoAttempt) return

  const roomUrl = offered?.url ? withChatVideoTopic(offered.url, topic) : ''
  const operator = offered?.operator ?? offered?.host
  // Two written-out keys, not one chosen by a condition (see `toggleMute`). With the default
  // the invitation reads as it always did -- "Video call: Video call" would say it twice; with a
  // topic of one's own, the topic in words on a line of its own, since it may end on "?" or ".".
  const delivered =
    roomUrl && through
      ? await through({
          body:
            topic === topicDefault
              ? t('chatThread.videoInvite', { operator, url: roomUrl })
              : t('chatThread.videoInviteTopic', { topic, operator, url: roomUrl }),
          notify,
        })
      : false
  if (attempt !== videoAttempt) return

  videoCalling.value = false
  if (!delivered) {
    room?.close()
    videoRoomWindow = null
    videoProblem.value = videoRoomProblem(roomError, t('chatThread.videoNotSent'))
    return
  }
  // The member's now: letting the question go must not close it.
  videoRoomWindow = null
  // The app's way. Should the address unexpectedly not be one the app takes, the dialog offers
  // the room in the browser, as where a window was held back.
  if (inApp) {
    const appUrl = chatVideoAppUrl(roomUrl)
    if (!appUrl) {
      videoRoomToOpen.value = roomUrl
      return
    }
    openInJitsiApp(appUrl)
    // The call waits on until the app takes it, and the question closes then. Where no sign
    // comes, it says so and offers the room in the browser.
    videoCalling.value = true
    stopVideoAppWatch = watchJitsiAppOpening({
      onOpened: () => {
        videoAsking.value = false
      },
      onMissed: () => {
        videoCalling.value = false
        videoRoomToOpen.value = roomUrl
        videoAppMissed.value = true
      },
    })
    return
  }
  // ⚠️ `closed` too: a window the member shut while the invitation was on its way has no
  // `location` to send anywhere. Then, as where the browser held it back, the dialog offers
  // the room as a link.
  if (room && !room.closed) {
    room.location.href = roomUrl
    videoAsking.value = false
  } else {
    videoRoomToOpen.value = roomUrl
  }
}

/** The question before joining a call is open. */
const videoJoining = ref(false)
const videoJoinTitle = computed(() =>
  props.group
    ? t('chatGroup.videoJoinTitle', { name: props.name })
    : t('chatThread.videoJoinTitle', { name: props.name }),
)
/**
 * The room of the invitation whose link was clicked. ⛔ The call's secret, as `videoRoomToOpen`:
 * here only while the question is open, in no store and no log.
 */
const videoJoinRoom = ref('')
/** "Join call" handed the room to the Jitsi app and waits for its sign; the button waits too. */
const videoJoinWaiting = ref(false)
/** No sign came that the app opened: the question says so (ChatVideoAppMissed). */
const videoJoinMissed = ref(false)
let stopJoinAppWatch = null

/** Asked by a click on the link of a video invitation in the thread (ChatMessageText). */
const askJoinVideoCall = (roomUrl) => {
  videoJoinRoom.value = roomUrl
  videoInApp.value = readChatVideoInApp(store.state.gradidoID)
  videoJoining.value = true
}

watch(videoJoining, (open) => {
  if (open) return
  stopJoinAppWatch?.()
  stopJoinAppWatch = null
  videoJoinWaiting.value = false
  videoJoinMissed.value = false
  videoJoinRoom.value = ''
})

/**
 * "Join call": the room in the Jitsi app where the box is ticked, else in a window of its own --
 * both in the click itself, where the browser allows either. The window as the thread's link
 * opens it: no `opener`, no referrer. The app's way waits for the app's sign, as the start does.
 */
const joinVideoCall = () => {
  if (videoJoinWaiting.value) return
  const roomUrl = videoJoinRoom.value
  if (!roomUrl) return
  const appUrl = offersJitsiApp() && videoInApp.value ? chatVideoAppUrl(roomUrl) : null
  if (!appUrl) {
    videoJoining.value = false
    window.open(roomUrl, '_blank', 'noopener,noreferrer')
    return
  }
  openInJitsiApp(appUrl)
  videoJoinWaiting.value = true
  stopJoinAppWatch = watchJitsiAppOpening({
    onOpened: () => {
      videoJoining.value = false
    },
    onMissed: () => {
      videoJoinWaiting.value = false
      videoJoinMissed.value = true
    },
  })
}

// Gone with the window -- closed while a call was on its way, too: the question is let go as a
// cancel lets it go (`forgetVideoCall`): a room's window not sent anywhere yet closes, nothing on
// its way is taken up, and no watch for the Jitsi app starts or stays behind (coderabbit, #4015).
// The question before joining lets go of its watch as well.
onBeforeUnmount(() => {
  forgetVideoCall()
  stopJoinAppWatch?.()
})

/** The question before a call let go -- the window came to somebody else. */
const letGo = () => {
  videoAsking.value = false
}

/**
 * `ask`: the question before a call, from the window's camera. `askJoin`: the question before
 * joining one, from the link of an invitation in the thread (the window provides it as
 * `CHAT_VIDEO_JOIN`, ChatMessageText). `letGo`: see above.
 */
defineExpose({ ask: askVideoCall, askJoin: askJoinVideoCall, letGo })
</script>

<style lang="scss" scoped>
/* The questions before a call: the start button waits while the call is being made, as the
   compose bar's send button does -- `aria-disabled`, so a keyboard that pressed it keeps its
   place, and a look that says it waits. So does "Join call" while the Jitsi app is awaited. */
.chat-video-start[aria-disabled='true'],
.chat-video-join[aria-disabled='true'],
.chat-video-gear[aria-disabled='true'],
.chat-video-plan[aria-disabled='true'] {
  opacity: 0.65;
  cursor: default;
}

/* The gear (V5): drawn as the camera and the bell are -- the icon in the muted colour, nothing
   filled -- at the left end of the footer, the other buttons pushed to the right. The hit area is
   as high as the buttons beside it (46px). */
.chat-video-gear {
  appearance: none;
  display: inline-flex;
  align-items: center;
  justify-content: center;
  width: 2.875rem;
  height: 2.875rem;
  margin-right: auto;
  padding: 0;
  border: 1px solid transparent;
  border-radius: 50%;
  background: transparent;
  color: var(--text-muted, #6c757d);
  font-size: 1.35rem;
  line-height: 1;
  cursor: pointer;
}

.chat-video-gear:hover {
  background: var(--surface-muted, #f2f4f6);
  color: var(--bs-body-color);
}

.chat-video-gear:focus-visible {
  outline: 2px solid var(--success, #047006);
  outline-offset: 2px;
}

/* The buttons of the gear's view with their sign before the word, and the server chosen with the
   server's sign. */
.chat-video-tool,
.chat-video-server {
  display: inline-flex;
  align-items: center;
  gap: 0.45rem;
}

/* "Calendar file" and "Copy link" side by side, one under the other where they do not fit. */
.chat-video-tools {
  display: flex;
  flex-wrap: wrap;
  gap: 0.5rem;
}

/* A planned call's time (V5b): the day wider than the two times of day. Where the dialog is too
   narrow for three fields (a phone), the day takes its own row and the two times share the next. */
.chat-video-when {
  display: grid;
  grid-template-columns: minmax(0, 1.6fr) minmax(0, 1fr) minmax(0, 1fr);
  gap: 0.5rem;
}

.chat-video-when label {
  display: block;
  margin-bottom: 0.25rem;
}

@media (width <= 420px) {
  .chat-video-when {
    grid-template-columns: minmax(0, 1fr) minmax(0, 1fr);
  }

  .chat-video-when-day {
    grid-column: 1 / -1;
  }
}

/* The copied link breaks anywhere rather than reach past the dialog: an address has no spaces. */
.chat-video-link {
  overflow-wrap: anywhere;
  color: var(--bs-body-color);
}
</style>
