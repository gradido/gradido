<!-- AI-GENERATED — not an architecture reference -->
<template>
  <div ref="root" class="chat-compose" data-test="chat-compose">
    <!-- The first message of a pair always goes out as a mail too -- the server decides that,
         whatever is asked (E-024) -- so there is nothing to choose, and a sentence says so
         where the box would stand. -->
    <p v-if="first" :id="firstId" class="chat-compose-first" data-test="chat-compose-first">
      <i-mdi-email-outline class="chat-compose-first-icon" aria-hidden="true" />
      <span>{{ t('chatThread.firstGoesByEmail', { name }) }}</span>
    </p>

    <!-- The picture that goes with the next message (the mockup, "Bild gewählt, vor dem Senden"):
         while it is opened, and again while it is made small for sending, a quiet square and "Bild
         wird vorbereitet …"; otherwise the picture as it will go -- drawn from the picture as
         chosen, cut as the member cut it (E-047) -- with "Bild" and "Wird mit Deiner Nachricht
         gesendet.", and a round button to take it off. -->
    <div
      v-if="preparing || picture"
      class="chat-compose-attached"
      data-test="chat-compose-attached"
    >
      <span v-if="preparing" class="chat-compose-attached-wait" aria-hidden="true" />
      <canvas
        v-else
        ref="thumb"
        class="chat-compose-attached-picture"
        aria-hidden="true"
        data-test="chat-compose-attached-picture"
      />
      <div class="chat-compose-attached-words" data-test="chat-compose-attached-words">
        <template v-if="preparing">{{ t('chatThread.imagePreparing') }}</template>
        <template v-else>
          {{ t('chatThread.imageReady') }}
          <small>{{ t('chatThread.imageReadyHint') }}</small>
        </template>
      </div>
      <button
        v-if="!preparing"
        type="button"
        class="chat-compose-attached-remove"
        :aria-label="t('chatThread.imageRemove')"
        :title="t('chatThread.imageRemove')"
        data-test="chat-compose-attached-remove"
        @click="removePicture"
      >
        <i-mdi-close class="chat-compose-attached-remove-icon" aria-hidden="true" />
      </button>
    </div>

    <div class="chat-compose-row">
      <!-- The paperclip (E-042, E-044 F1): with the pictures (P7) it opens a small menu above it,
           "Bild — Foto oder Bildschirmfoto" and "Datei — über SwissTransfer, bis 50 GB". A sign
           without a word: the paperclip is the learnt exception to E-033; the words are in the
           menu. Also with the first message of a conversation -- a picture or a link is an
           ordinary message.

           ⚠️ A disclosure, not an ARIA menu, and so no `aria-haspopup`: the picture's entry is a
           file field, and a file field may not take the role of a menu item -- a "menu" that is
           not one would send a screen reader into keys that do nothing. The button says whether
           the entries are shown (`aria-expanded`) and which they are (`aria-controls`); Tab walks
           them, Esc closes them. -->
      <div
        ref="attachArea"
        class="chat-compose-attach-area"
        @keydown.esc="closeMenuByKey"
        @focusout="closeMenuWhenFocusLeaves"
      >
        <button
          ref="clip"
          type="button"
          class="chat-compose-attach"
          :class="{ 'is-open': menuOpen || fileHintOpen }"
          :aria-label="t('chatThread.attach')"
          :title="t('chatThread.attach')"
          :aria-expanded="menuOpen ? 'true' : 'false'"
          :aria-controls="menuId"
          data-test="chat-compose-attach"
          @click="toggleMenu"
        >
          <i-mdi-paperclip class="chat-compose-attach-icon" aria-hidden="true" />
        </button>
        <!-- ⛔ Always in the page, hidden by a class while closed -- not `v-if`, not `v-show`. The
             picture's file field lives in here, and it has to stay rendered while the device's
             picker is open: the menu closes the moment an entry is chosen, and a field that is
             taken out of the page or set to `display: none` under an open picker may never hear
             which file was chosen. `visibility: hidden` takes the entries out of the tab order and
             out of a screen reader's reach just the same. -->
        <div
          :id="menuId"
          class="chat-compose-menu"
          :class="{ 'is-open': menuOpen }"
          role="group"
          :aria-label="t('chatThread.attach')"
          data-test="chat-compose-menu"
        >
          <!-- ⛔ A label for a file field that is hidden only from the eye (FOTO-04): a field set to
               `display: none` and opened with `input.click()` did nothing at all in an embedded
               frame. The label opens the field without a line of script; the field stays in the tab
               order, and the label beside it shows its focus. No `capture`: on a phone the picker
               offers the camera and the photos by itself (AS-012). -->
          <input
            :id="pickerId"
            ref="picker"
            type="file"
            accept="image/*"
            class="chat-compose-picker visually-hidden"
            data-test="chat-compose-picker"
            @click="closeMenuOnceChosen"
            @change="takePicture"
          />
          <label :for="pickerId" class="chat-compose-menu-item" data-test="chat-compose-picture">
            <i-mdi-image class="chat-compose-menu-icon" aria-hidden="true" />
            <span class="chat-compose-menu-words">
              <span class="chat-compose-menu-label">{{ t('chatThread.attachImage') }}</span>
              <span class="chat-compose-menu-hint">{{ t('chatThread.attachImageHint') }}</span>
            </span>
          </label>
          <button
            type="button"
            class="chat-compose-menu-item"
            data-test="chat-compose-file"
            @click="chooseFile"
          >
            <i-mdi-file-document class="chat-compose-menu-icon" aria-hidden="true" />
            <span class="chat-compose-menu-words">
              <span class="chat-compose-menu-label">{{ t('chatThread.attachFile') }}</span>
              <span class="chat-compose-menu-hint">{{ t('chatThread.attachFileHint') }}</span>
            </span>
          </button>
        </div>
      </div>
      <label :for="fieldId" class="visually-hidden">{{ placeholder }}</label>
      <!-- ⛔ Enter makes a new line, as in every text field; it never sends. Many in the
           community did not grow up with chat programs, and a message that leaves half-written
           cannot be called back. The button sends -- at the desk also Cmd/Ctrl+Enter. -->
      <textarea
        :id="fieldId"
        ref="field"
        v-model="text"
        class="chat-compose-field"
        rows="1"
        :maxlength="MESSAGE_MAX_CHARS"
        :placeholder="placeholder"
        :aria-describedby="describedBy"
        data-test="chat-compose-field"
        @input="grow"
        @keydown.enter="sendOnModifiedEnter"
      />
      <!-- `aria-disabled`, not `disabled`: a focused button that is disabled loses its focus in
           Chrome, and a keyboard that sent with it would be nowhere while the message is on its
           way. The handler turns a press away instead.

           `@mousedown.prevent` keeps the focus in the field when the button is clicked or
           tapped -- the keyboard of a phone stays open for the next message. The click itself
           is not prevented. -->
      <button
        type="button"
        class="chat-compose-send"
        :aria-label="t('chatThread.send')"
        :title="t('chatThread.send')"
        :aria-disabled="canSend ? 'false' : 'true'"
        data-test="chat-compose-send"
        @mousedown.prevent
        @click="submit"
      >
        <i-mdi-send class="chat-compose-send-icon" aria-hidden="true" />
      </button>
    </div>

    <!-- The sender's wish for THIS message (E-024): empty by default, and empty again after
         every message sent -- a mail is the exception somebody asks for, not a setting. A real
         checkbox with its word beside it (E-029: a symbol without a word is not read by many). -->
    <div v-if="!first" class="chat-compose-options">
      <!-- The box and its word as ONE thing, the box inside its label: a long word (in
           Russian the whole sentence) wraps beside the box instead of the row putting the
           word on a line of its own under an empty-looking box. -->
      <label class="chat-compose-check" data-test="chat-compose-email-label">
        <input
          v-model="alsoByEmail"
          type="checkbox"
          class="chat-compose-check-box"
          data-test="chat-compose-email"
        />
        <span class="chat-compose-check-text">
          {{ alsoByEmail ? t('chatThread.alsoByEmailTo', { name }) : t('chatThread.alsoByEmail') }}
        </span>
      </label>
      <!-- No sentence beside it on what an empty box means: the desk has the phone's label and
           nothing else (Bernd, 24.09.2026) -- in a window 500 px wide the sentence mostly fell
           to a line of its own. -->
    </div>

    <p
      v-if="showRemaining"
      :id="remainingId"
      class="chat-compose-note"
      data-test="chat-compose-remaining"
    >
      {{ t('chatThread.remaining', { n: remaining }, remaining) }}
    </p>
    <!-- ⛔ Where it went wrong, and not in a toast: the text is still in the field above, and
         this line says that it is. `role="alert"` is announced when it is put in. Two refusals
         about a picture have words of their own (`failedReason`). -->
    <p v-if="failed" class="chat-compose-note" role="alert" data-test="chat-compose-failed">
      {{ failedWords }}
    </p>
    <!-- A picture that could not be made ready: why, in the bar's own words. -->
    <p
      v-if="pictureProblem"
      class="chat-compose-note"
      role="alert"
      data-test="chat-compose-picture-problem"
    >
      {{ pictureProblemWords }}
    </p>
    <!-- For the ear: the picture's state as it changes -- the preview above has no words a screen
         reader would hear on its own. Always in the page, so the words are announced when they
         change (a live region that appears together with its text is not). -->
    <p class="visually-hidden" role="status" data-test="chat-compose-picture-status">
      {{ pictureStatus }}
    </p>

    <!-- The hint behind the paperclip (E-042, E-044): Gradido stores no files, SwissTransfer
         carries them -- three steps, what the service is, and the way there. Built as the question
         before a video call is (ContactWindow): no header, the title in the body and therefore a
         name of its own (`aria-label`); its own footer; `lazy`. -->
    <BModal
      v-model="fileHintOpen"
      lazy
      centered
      no-header
      :aria-label="t('chatThread.fileTitle')"
      data-test="chat-compose-file-hint"
    >
      <p class="h5 mb-2" data-test="chat-compose-file-title">{{ t('chatThread.fileTitle') }}</p>
      <p class="mb-0">{{ t('chatThread.fileIntro') }}</p>
      <ol class="chat-compose-file-steps" data-test="chat-compose-file-steps">
        <li>{{ t('chatThread.fileStep1') }}</li>
        <li>{{ t('chatThread.fileStep2') }}</li>
        <li>{{ t('chatThread.fileStep3') }}</li>
      </ol>
      <p class="small text-muted mb-0" data-test="chat-compose-file-about">
        {{ t('chatThread.fileAbout') }}
      </p>
      <!-- On a phone or a tablet the app is the short way: "share" from any app, and in its link
           mode it asks for no e-mail address (Notiz §4.2). -->
      <p v-if="showAppTip" class="chat-compose-file-tip small" data-test="chat-compose-file-tip">
        <i-mdi-cellphone class="chat-compose-file-tip-icon" aria-hidden="true" />
        <span>{{ t('chatThread.fileAppTip') }}</span>
      </p>
      <template #footer>
        <BButton variant="secondary" data-test="chat-compose-file-close" @click="closeFileHint">
          {{ t('form.close') }}
        </BButton>
        <!-- A link, not a button: SwissTransfer opens in a tab of its own the way a link opens,
             and a click with a key held or "copy link" work as on any link. The click closes the
             hint as well and lets the link go on: whoever comes back finds the field for the
             link. In the gold of the house's buttons -- `btn-md` as BButton gives its own. -->
        <a
          class="btn btn-md btn-gradido chat-compose-file-open"
          :href="SWISSTRANSFER_URL"
          target="_blank"
          rel="noopener noreferrer"
          data-test="chat-compose-file-open"
          @click="closeFileHint"
        >
          {{ t('chatThread.fileOpen') }}
          <i-mdi-open-in-new class="chat-compose-file-open-icon" aria-hidden="true" />
        </a>
      </template>
    </BModal>
  </div>
</template>

<script setup>
import { computed, nextTick, onBeforeUnmount, onMounted, ref, shallowRef, useId, watch } from 'vue'
import { useI18n } from 'vue-i18n'
import { BButton, BModal } from 'bootstrap-vue-next'
import { SWISSTRANSFER_URL } from '@/utils/chatFileLink'
import { encodeChatImage, openChatImage } from '@/utils/chatImage'
import { CHAT_IMAGE_UNEDITED, chatImageCut, drawChatImageCut } from '@/utils/chatImageEdit'
import { chatNotifyFor } from '@/utils/chatNotify'
import { isComputer } from '@/utils/isComputer'
import { MESSAGE_MAX_CHARS, message as messageSchema } from '@/validationSchemas'

/**
 * The line under the thread that writes to the person in it (P3, mockup E V03).
 *
 * It only asks: it emits `send` with the text, the wish and the picture, and the thread does the
 * sending. Whether it went through, the thread says back through its props -- `sending` while the
 * message is on its way, `failed` when it ends without it -- and only a message that went
 * through empties the field and takes the picture off. The text in the field is never lost
 * otherwise.
 */
const props = defineProps({
  /** The other person's name, as the window shows it. */
  name: { type: String, default: '' },
  /** No conversation yet: the message will go out as a mail in any case (E-024). */
  first: { type: Boolean, default: false },
  /** A message is on its way; the button waits. */
  sending: { type: Boolean, default: false },
  /** The last message did not go through; its text is still in the field. */
  failed: { type: Boolean, default: false },
  /**
   * Why it did not, where the server refused it for its picture (chatImageRefusal):
   * IMAGE_NOT_ACCEPTED or TOO_LARGE_ACROSS_BORDER. Empty for every other failure -- "not sent".
   */
  failedReason: { type: String, default: '' },
  /**
   * The words to begin with: what stood in the field, not sent yet, when iOS started the wallet
   * over (utils/chatReturn). Read once, when the bar is made.
   */
  initialText: { type: String, default: '' },
})

const emit = defineEmits(['send'])

const { t } = useI18n()

/**
 * The count of what is left appears only near the end: under every message it would be a
 * number nobody needs. The field itself stops at the server's limit (`maxlength`).
 */
const SHOW_REMAINING_BELOW = 200

const id = useId()
const fieldId = `${id}-field`
const firstId = `${id}-first`
const remainingId = `${id}-remaining`

const root = ref(null)
const field = ref(null)
const text = ref(props.initialText)
const alsoByEmail = ref(false)

/**
 * The picture that goes with the next message (P7): `{ source, edit }` -- the picture as chosen,
 * decoded and whole (utils/chatImage, `openChatImage`), and what the member did to it in the
 * editor (utils/chatImageEdit). It is made small only when the message is sent (E-047, point 6);
 * until then it stays in full quality, for the editor and for "Sichern". Null without one; one
 * picture a message, a second one takes the first one's place.
 *
 * ⛔ In memory only. It does not come back after iOS starts the wallet over, as the words do
 * (#3999, `draft` below): a chat picture is never put into the device's storage (E-041, point 5),
 * and it is still on the device -- whoever lost it chooses it again in two taps, where words typed
 * would be gone for good. A shallow ref: nothing inside it changes, and its base64 is no business
 * of Vue's reactivity.
 */
const picture = shallowRef(null)
/** A picture is being opened, or made small for sending; the button waits for it. */
const preparing = ref(false)
/** Why the last picture chosen could not be made ready (ChatImageError), or null. */
const pictureProblem = ref(null)

/** With a picture, the words are its caption, and optional (E-044). */
const placeholder = computed(() =>
  picture.value || preparing.value
    ? t('chatThread.imageCaption')
    : t('chatThread.placeholder', { name: props.name }),
)

/** What is sent: the text without the space around it. */
const body = computed(() => text.value.trim())

/**
 * Without a picture, the rule the e-mail form holds a message to (1 to 2000 characters), asked
 * of what would be sent -- a field of spaces sends nothing. With a picture the text may be empty,
 * 0 to 2000, as the server takes it (P7a). Nothing while a picture is being made small: it was
 * chosen to go with this message.
 */
const canSend = computed(() => {
  if (props.sending || preparing.value) return false
  if (picture.value) return body.value.length <= MESSAGE_MAX_CHARS
  return messageSchema.isValidSync(body.value)
})

/** Counted like `maxlength` counts: the field as typed. */
const remaining = computed(() => MESSAGE_MAX_CHARS - text.value.length)
const showRemaining = computed(() => remaining.value < SHOW_REMAINING_BELOW)

const describedBy = computed(
  () =>
    [props.first ? firstId : null, showRemaining.value ? remainingId : null]
      .filter(Boolean)
      .join(' ') || undefined,
)

/**
 * The field grows with its text: one line empty, up to five, then it scrolls inside (the
 * limit is the stylesheet's `max-height`). The height is measured, not guessed from line
 * breaks -- a long line wraps as well.
 */
const grow = () => {
  const box = field.value
  if (!box) return
  box.style.height = 'auto'
  box.style.height = `${box.scrollHeight + box.offsetHeight - box.clientHeight}px`
}
// Words brought back after a restart: the field takes their height at once, as if typed.
onMounted(() => {
  if (text.value) grow()
})

/**
 * The words in the field as they stand, for the thread's note (utils/chatReturn). The words only:
 * a picture chosen does not come back after a restart (see `picture`).
 */
defineExpose({ draft: () => text.value })

/**
 * What went out with the last press. The field stays writable while a message is on its way,
 * so what is cleared afterwards is only what went out (coderabbit, PR #3974).
 */
let submitted = null

/**
 * Lets the browser paint "Bild wird vorbereitet …" before the picture is made small: making it
 * small holds the page for a moment, and without two frames the words would come after it.
 */
const afterPaint = () =>
  new Promise((resolve) => {
    if (typeof window.requestAnimationFrame !== 'function') {
      resolve()
      return
    }
    window.requestAnimationFrame(() => window.requestAnimationFrame(() => resolve()))
  })

/**
 * Sends what is in the bar as the press found it. A picture is made small here, and only here
 * (E-047, point 6): cut as the member cut it, under 32 KB (utils/chatImage). Where it cannot be,
 * the bar says so and keeps the picture and the words.
 */
const submit = async () => {
  if (!canSend.value) return
  const pressed = {
    text: text.value,
    body: body.value,
    alsoByEmail: alsoByEmail.value,
    picture: picture.value,
  }
  let image = null
  if (pressed.picture) {
    preparing.value = true
    pictureProblem.value = null
    try {
      await afterPaint()
      const ready = await encodeChatImage(pressed.picture.source, pressed.picture.edit)
      image = { data: ready.data, width: ready.width, height: ready.height }
    } catch (error) {
      pictureProblem.value = error?.problem ?? 'FORMAT'
      return
    } finally {
      preparing.value = false
    }
  }
  submitted = { text: pressed.text, alsoByEmail: pressed.alsoByEmail, picture: pressed.picture }
  emit('send', {
    body: pressed.body,
    // The enum NAMES the server takes, by the rule the contact window's video invitation
    // follows too (utils/chatNotify.js).
    notify: chatNotifyFor({ first: props.first, alsoByEmail: pressed.alsoByEmail }),
    image,
  })
}

/** The words of the line where a message did not go through (see the template). */
const failedWords = computed(() => {
  if (props.failedReason === 'IMAGE_NOT_ACCEPTED') return t('chatThread.imageNotAccepted')
  if (props.failedReason === 'TOO_LARGE_ACROSS_BORDER') {
    return t('chatThread.imageTooLargeAcrossBorder')
  }
  return t('chatThread.notSent')
})

/** Why a picture could not be made ready, in the bar's own words. */
const pictureProblemWords = computed(() => {
  if (pictureProblem.value === 'SOURCE_TOO_LARGE') return t('chatThread.imageTooLarge')
  if (pictureProblem.value === 'HEIC') return t('chatThread.imageHeic')
  if (pictureProblem.value === 'NOT_SMALL_ENOUGH') return t('chatThread.imageTooBig')
  return t('chatThread.imageFormat')
})

/** What the status says for the ear about the picture (see the template). */
const pictureStatus = computed(() => {
  if (preparing.value) return t('chatThread.imagePreparing')
  if (picture.value) return `${t('chatThread.imageReady')}. ${t('chatThread.imageReadyHint')}`
  return ''
})

/**
 * Only the last picture chosen counts: a second one chosen while the first is still being made
 * small takes its place, and the first one's result, whenever it comes, is let go.
 */
let pictureRound = 0

/**
 * The picture the device's picker answered with, opened for the message: decoded and kept whole
 * (utils/chatImage), not edited yet.
 */
const takePicture = async (event) => {
  const input = event.target
  const file = input.files?.[0]
  // Emptied, so the same file chosen again is a change again.
  input.value = ''
  if (!file) return
  const round = ++pictureRound
  pictureProblem.value = null
  preparing.value = true
  try {
    const source = await openChatImage(file)
    if (round !== pictureRound) return
    picture.value = { source, edit: CHAT_IMAGE_UNEDITED }
  } catch (error) {
    if (round !== pictureRound) return
    // A picture chosen before stays: nothing has taken its place.
    pictureProblem.value = error?.problem ?? 'FORMAT'
  } finally {
    if (round === pictureRound) preparing.value = false
  }
}

/** "Bild entfernen": the picture is taken off; the focus goes to the paperclip, for another one. */
const removePicture = () => {
  picture.value = null
  clip.value?.focus({ preventScroll: true })
}

/** The preview's square, in CSS pixels (the stylesheet's 3.5rem). */
const THUMB = 56
const thumb = ref(null)

/**
 * Draws the preview: the cutout, filling the square from its middle, at the screen's own
 * resolution (at most twice, as the avatar's preview). The same drawing as the editor's and the
 * picture that is sent (drawChatImageCut), so the three show the same part.
 */
const drawThumb = () => {
  const canvas = thumb.value
  const chosen = picture.value
  if (!canvas || !chosen) return
  const size = Math.round(THUMB * Math.min(2, window.devicePixelRatio || 1))
  canvas.width = size
  canvas.height = size
  const context = canvas.getContext('2d')
  if (!context) return
  const { source, edit } = chosen
  const cut = chatImageCut(source.width, source.height, edit)
  const scale = Math.max(size / cut.width, size / cut.height)
  const width = cut.width * scale
  const height = cut.height * scale
  context.imageSmoothingEnabled = true
  context.imageSmoothingQuality = 'high'
  drawChatImageCut(context, source.image, source.width, source.height, edit, {
    x: (size - width) / 2,
    y: (size - height) / 2,
    width,
    height,
  })
}
watch([picture, preparing], async () => {
  await nextTick()
  drawThumb()
})

/**
 * The paperclip's menu (E-044, F1): "Bild" and "Datei". It closes when an entry is chosen, on Esc
 * and on a press anywhere else; the focus goes into it when it opens and back to the paperclip
 * when it closes by a choice or by Esc. A press elsewhere leaves the focus where the press put it.
 */
const menuId = `${id}-attach-menu`
const pickerId = `${id}-picker`
const attachArea = ref(null)
const clip = ref(null)
const picker = ref(null)
const menuOpen = ref(false)

const closeMenuOnPressElsewhere = (event) => {
  if (!attachArea.value?.contains(event.target)) closeMenu()
}

const openMenu = async () => {
  // Another go: what went wrong with the last picture is said no longer.
  pictureProblem.value = null
  menuOpen.value = true
  document.addEventListener('pointerdown', closeMenuOnPressElsewhere, true)
  await nextTick()
  picker.value?.focus({ preventScroll: true })
}

const closeMenu = ({ focusClip = false } = {}) => {
  if (!menuOpen.value) return
  menuOpen.value = false
  document.removeEventListener('pointerdown', closeMenuOnPressElsewhere, true)
  if (focusClip) clip.value?.focus({ preventScroll: true })
}
onBeforeUnmount(() => document.removeEventListener('pointerdown', closeMenuOnPressElsewhere, true))

const toggleMenu = () => (menuOpen.value ? closeMenu({ focusClip: true }) : openMenu())

/**
 * ⛔ Esc closes the menu and nothing more: stopped here, it does not reach the contact window,
 * whose dialog closes on an Esc from anywhere inside it. With the menu shut, Esc goes on as always.
 */
const closeMenuByKey = (event) => {
  if (!menuOpen.value) return
  event.stopPropagation()
  event.preventDefault()
  closeMenu({ focusClip: true })
}

/**
 * Tab past the last entry, or anywhere out of the menu: it closes behind the focus.
 *
 * ⛔ Only a focus that lands on something else is leaving. A press on a part that takes no focus
 * -- the label of "Bild", the space between the entries -- hands the focus to the nearest ancestor
 * that does, the contact window. Measured in Chrome (P7c): closed on that, the menu hid the label
 * under the pointer before the button came up, and the picker never opened. A press outside closes
 * the menu by itself (`closeMenuOnPressElsewhere`).
 */
const closeMenuWhenFocusLeaves = (event) => {
  const to = event.relatedTarget
  if (!menuOpen.value || !to || to.contains(attachArea.value) || attachArea.value?.contains(to)) {
    return
  }
  closeMenu()
}

/**
 * "Bild" was chosen -- with the label or a key on the field; either way the field hears the click
 * that opens the device's picker. The menu closes a moment later, in a task of its own: the picker
 * opens after the click, and the field stays in a menu that is still shown until then.
 */
const closeMenuOnceChosen = () => {
  setTimeout(() => closeMenu({ focusClip: true }))
}

/** "Datei": the hint, as the paperclip opened it before the pictures. */
const chooseFile = () => {
  // The focus goes to the paperclip first: the hint's dialog hands it back, when it closes, to
  // whatever had it when it opened -- and the entry that had it is hidden by then.
  closeMenu({ focusClip: true })
  openFileHint()
}

/** The hint behind the paperclip: how a file goes through SwissTransfer (E-042). */
const fileHintOpen = ref(false)

/**
 * The tip to SwissTransfer's app, for a phone or a tablet: asked when the hint opens, nothing
 * kept. Where the device cannot be asked (`isComputer` says no), the tip shows -- on a computer
 * it is one sentence too many, never a wrong way.
 */
const showAppTip = ref(false)

const openFileHint = () => {
  showAppTip.value = !isComputer()
  fileHintOpen.value = true
}

const closeFileHint = () => {
  fileHintOpen.value = false
}

/** Cmd+Enter or Ctrl+Enter sends; Enter alone is a new line (see the template). */
const sendOnModifiedEnter = (event) => {
  if (!(event.metaKey || event.ctrlKey) || event.isComposing) return
  event.preventDefault()
  submit()
}

/**
 * Focus goes back into the field -- unless the member has moved on meanwhile: a tap on the
 * bell while the message was on its way is not taken back.
 */
const focusStaysHere = () => {
  const active = document.activeElement
  return !active || active === document.body || Boolean(root.value?.contains(active))
}

/**
 * A message went through: the field empties, the box is empty again (E-024: the wish is for
 * one message), the picture is taken off, and the keyboard stays in the field for the next one.
 * A message that did not go through leaves all of it as it was.
 *
 * ⛔ Only what went out is cleared. Text typed while the message was on its way stays, and so
 * does a box the member changed meanwhile -- and a picture chosen meanwhile, which goes with the
 * next message: the text in the field is never lost but by sending it.
 */
watch(
  () => props.sending,
  async (now, before) => {
    if (!before || now) return
    const sent = submitted
    submitted = null
    if (props.failed || !sent) return
    if (sent.picture && picture.value === sent.picture) picture.value = null
    if (alsoByEmail.value === sent.alsoByEmail) alsoByEmail.value = false
    if (text.value !== sent.text) return
    text.value = ''
    await nextTick()
    grow()
    if (focusStaysHere()) field.value?.focus({ preventScroll: true })
  },
)
</script>

<style lang="scss" scoped>
/* Under the thread, set apart by a line, over the width of the window. On the sheet it keeps
   its own height and the thread above takes what is left (ContactWindow). `position: relative`:
   the paperclip's menu hangs from here, above the bar and over the end of the thread. */
.chat-compose {
  position: relative;
  flex: 0 0 auto;
  margin-top: 0.5rem;
  padding-top: 0.6rem;
  border-top: 1px solid var(--bs-border-color, #dee2e6);
}

/* The first message: a quiet sentence on the same light gold as one's own messages. */
.chat-compose-first {
  display: flex;
  align-items: flex-start;
  gap: 0.45rem;
  margin: 0 0 0.5rem;
  padding: 0.4rem 0.65rem;
  border: 1px solid var(--gold, #c58d38);
  border-radius: 0.5rem;
  background: rgb(197 141 56 / 12%);
  color: var(--bs-body-color);
  font-size: 0.8rem;
  line-height: 1.4;
}

.chat-compose-first-icon {
  flex: 0 0 auto;
  width: 1.1em;
  height: 1.1em;
  margin-top: 0.1em;
}

/* The picture chosen, over the field (the mockup): a small square of it, what it is, and the
   round button that takes it off, on the muted surface. */
.chat-compose-attached {
  display: flex;
  align-items: center;
  gap: 0.65rem;
  margin: 0 0 0.5rem;
  padding: 0.4rem;
  border: 1px solid var(--border, #dee2e6);
  border-radius: 0.75rem;
  background: var(--surface-muted, #f2f4f6);
}

.chat-compose-attached-picture,
.chat-compose-attached-wait {
  flex: 0 0 auto;
  width: 3.5rem;
  height: 3.5rem;
  border-radius: 0.5rem;
}

/* While it is opened or made small: a quiet square in its place, no spinner. */
.chat-compose-attached-wait {
  background: var(--border, #dee2e6);
}

.chat-compose-attached-words {
  flex: 1 1 auto;
  min-width: 0;
  font-size: 0.85rem;
  font-weight: 600;
  line-height: 1.3;
}

/* ⚠️ Small text needs 4.5:1 on the muted surface, and one colour does not reach it in both
   modes: light, Bootstrap's secondary colour (the body colour at 75 %, about 6.4:1); dark, the
   body colour at 75 % -- the dark muted grey reaches only about 4.3:1 there (ChatBubble measures
   the same). */
.chat-compose-attached-words small {
  display: block;
  color: var(--bs-secondary-color, #6c757d);
  font-size: 0.8rem;
  font-weight: 400;
}

.dark-mode .chat-compose-attached-words small {
  color: var(--bs-body-color);
  opacity: 0.75;
}

.chat-compose-attached-remove {
  display: inline-flex;
  flex: 0 0 auto;
  align-items: center;
  justify-content: center;
  width: 2.4rem;
  height: 2.4rem;
  padding: 0;
  border: 0;
  border-radius: 50%;
  background: transparent;
  color: var(--bs-secondary-color, #6c757d);
  cursor: pointer;
}

@media (hover: hover) {
  .chat-compose-attached-remove:hover {
    background: var(--surface, #fff);
    color: var(--bs-body-color);
  }
}

.chat-compose-attached-remove:focus-visible {
  outline: 2px solid var(--success, #047006);
  outline-offset: 2px;
}

.chat-compose-attached-remove-icon {
  width: 1.2rem;
  height: 1.2rem;
}

.chat-compose-row {
  display: flex;
  align-items: flex-end;
  gap: 0.5rem;
}

/* The paperclip: round and as large as the send button at the other end of the row, drawn as
   the contact window's gear and camera are -- the sign in the muted colour, nothing filled. A
   surface under it where a mouse rests on it and while its hint is open. The surface for the
   mouse only: on a touch screen a tap would leave it standing after the hint has closed. */
.chat-compose-attach {
  display: inline-flex;
  flex: 0 0 auto;
  align-items: center;
  justify-content: center;
  width: 2.4rem;
  height: 2.4rem;
  padding: 0;
  border: 0;
  border-radius: 50%;
  background: transparent;
  color: var(--bs-secondary-color, #6c757d);
  cursor: pointer;
}

.chat-compose-attach.is-open {
  background: var(--surface-muted, #f2f4f6);
  color: var(--bs-body-color);
}

@media (hover: hover) {
  .chat-compose-attach:hover {
    background: var(--surface-muted, #f2f4f6);
    color: var(--bs-body-color);
  }
}

.chat-compose-attach:focus-visible {
  outline: 2px solid var(--success, #047006);
  outline-offset: 2px;
}

.chat-compose-attach-icon {
  width: 1.45rem;
  height: 1.45rem;
}

/* The paperclip and its menu, one thing for the keys and the pointer; in the row it is only the
   paperclip -- the menu is taken out of the flow and hangs from the bar (`.chat-compose`). */
.chat-compose-attach-area {
  display: flex;
  flex: 0 0 auto;
}

/* The menu above the paperclip (the mockup, "Büroklammer offen"): a small card of the window's
   own surface with a shadow, as wide as its words need and never wider than the bar. */
.chat-compose-menu {
  position: absolute;
  bottom: calc(100% + 0.35rem);
  left: 0;
  z-index: 5;
  display: flex;
  flex-direction: column;
  gap: 0.15rem;
  min-width: 16rem;
  max-width: 100%;
  padding: 0.35rem;
  border: 1px solid var(--border, #dee2e6);
  border-radius: 0.85rem;
  background: var(--surface, #fff);
  box-shadow: 0 8px 28px rgb(0 0 0 / 22%);
}

/* Closed: not seen, not reached by Tab, not read out -- and still rendered (see the template). */
.chat-compose-menu:not(.is-open) {
  visibility: hidden;
}

/* An entry: the sign in gold, the word, a quieter line under it. At least 44 px high, a finger's
   size -- 3rem is 48. */
.chat-compose-menu-item {
  display: flex;
  align-items: center;
  gap: 0.75rem;
  min-height: 3rem;
  margin: 0;
  padding: 0.4rem 0.65rem;
  border: 0;
  border-radius: 0.6rem;
  background: transparent;
  color: var(--bs-body-color);
  font: inherit;
  line-height: 1.25;
  text-align: left;
  cursor: pointer;
}

@media (hover: hover) {
  .chat-compose-menu-item:hover {
    background: var(--surface-muted, #f2f4f6);
  }
}

/* The picture's entry is a label; its field, hidden from the eye, is what the keyboard reaches.
   The label shows the field's focus -- without this, Tab lands on something nobody can see. */
.chat-compose-menu-item:focus-visible,
.chat-compose-picker:focus-visible + .chat-compose-menu-item {
  outline: 2px solid var(--success, #047006);
  outline-offset: 2px;
}

.chat-compose-menu-icon {
  flex: 0 0 auto;
  width: 1.4rem;
  height: 1.4rem;
  color: var(--gold, #c58d38);
}

.chat-compose-menu-words {
  min-width: 0;
}

.chat-compose-menu-label {
  display: block;
  font-weight: 600;
}

.chat-compose-menu-hint {
  display: block;
  color: var(--bs-secondary-color, #6c757d);
  font-size: 0.8rem;
}

/* ⚠️ `font-size: 1rem` is not a matter of taste: Safari on the iPhone zooms into any field
   under 16 px the moment it is touched, and the sheet would stand zoomed afterwards.
   `max-height`: five lines of this line-height plus the padding and the border -- beyond
   that the field scrolls inside instead of pushing the thread off the sheet. */
.chat-compose-field {
  flex: 1 1 auto;
  min-width: 0;
  max-height: calc(7em + 0.9rem + 2px);
  padding: 0.45rem 0.85rem;
  border: 1px solid var(--bs-border-color, #dee2e6);
  border-radius: 1.2rem;
  background: transparent;
  color: var(--bs-body-color);
  font-size: 1rem;
  line-height: 1.4;
  overflow-y: auto;
  resize: none;
}

/* ⚠️ One line, however long the name: a placeholder that wraps makes the empty field
   scroll, and its second line peeked out under the first (measured at 320 px and with a
   thirty-character name). Chrome cuts it at the edge; where `text-overflow` reaches a
   placeholder it ends in an ellipsis. */
.chat-compose-field::placeholder {
  overflow: hidden;
  color: var(--bs-secondary-color, #6c757d);
  opacity: 1;
  text-overflow: ellipsis;
  white-space: nowrap;
}

/* The focus as the field's own rim in the wallet's green, doubled by a shadow: as plain to see
   as the ring on the buttons, without a second line around the round field. */
.chat-compose-field:focus-visible {
  border-color: var(--success, #047006);
  outline: 0;
  box-shadow: 0 0 0 1px var(--success, #047006);
}

/* Round and gold, like one's own messages; the paper plane says what it does, the name says
   it to a screen reader. ⚠️ A touch darker than the house gold (`--gold`, #c58d38): white on
   that is 2.9:1, under the 3:1 a symbol needs to be made out (WCAG 1.4.11); #c08935 is 3.06:1,
   and beside the house gold hardly to be told apart (Bernd, 24.09.2026). The spec holds the
   contrast. */
.chat-compose-send {
  display: inline-flex;
  flex: 0 0 auto;
  align-items: center;
  justify-content: center;
  width: 2.4rem;
  height: 2.4rem;
  padding: 0;
  border: 0;
  border-radius: 50%;
  background: #c08935;
  color: #fff;
}

.chat-compose-send[aria-disabled='true'] {
  opacity: 0.45;
  cursor: default;
}

.chat-compose-send:focus-visible {
  outline: 2px solid var(--success, #047006);
  outline-offset: 2px;
}

.chat-compose-send-icon {
  width: 1.2rem;
  height: 1.2rem;
}

/* The box and its word; the word wraps beside the box rather than running past the window in
   a long language. */
.chat-compose-options {
  display: flex;
  flex-wrap: wrap;
  align-items: center;
  gap: 0.15rem 0.5rem;
  margin-top: 0.45rem;
  color: var(--bs-secondary-color, #6c757d);
  font-size: 0.8rem;
}

/* May shrink to the width of the bar, never below it: then its word wraps beside the box. */
.chat-compose-check {
  display: flex;
  flex: 0 1 auto;
  align-items: flex-start;
  gap: 0.5rem;
  min-width: 0;
  margin: 0;
  cursor: pointer;
}

.chat-compose-check-box {
  flex: 0 0 auto;
  width: 1.1rem;
  height: 1.1rem;
  margin: 0.05rem 0 0;
  accent-color: var(--gold, #c58d38);
}

.chat-compose-check-box:focus-visible {
  outline: 2px solid var(--success, #047006);
  outline-offset: 2px;
}

.chat-compose-check-box:checked + .chat-compose-check-text {
  color: var(--bs-body-color);
}

.chat-compose-note {
  margin: 0.35rem 0 0;
  color: var(--bs-secondary-color, #6c757d);
  font-size: 0.75rem;
}

/* The hint's three steps: a numbered list, a little air between its lines. */
.chat-compose-file-steps {
  display: flex;
  flex-direction: column;
  gap: 0.35rem;
  margin: 0.75rem 0;
  padding-left: 1.35rem;
}

/* The tip to the app on a phone: a quiet box, the phone in gold before its words. */
.chat-compose-file-tip {
  display: flex;
  align-items: flex-start;
  gap: 0.5rem;
  margin: 0.75rem 0 0;
  padding: 0.6rem 0.7rem;
  border-radius: 0.6rem;
  background: var(--surface-muted, #f2f4f6);
}

.chat-compose-file-tip-icon {
  flex: 0 0 auto;
  width: 1.2rem;
  height: 1.2rem;
  margin-top: 0.1rem;
  color: var(--gold, #c58d38);
}

/* The sign after "Open SwissTransfer": it opens elsewhere. `.btn-gradido` holds the link at
   `inline-block` with `!important`, so the sign stands in the line of the words. */
.chat-compose-file-open-icon {
  width: 1em;
  height: 1em;
  margin-left: 0.35rem;
  vertical-align: -0.125em;
}
</style>
