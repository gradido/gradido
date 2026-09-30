<!-- AI-GENERATED — not an architecture reference -->
<template>
  <!-- The picture of a chat message, large (E-044 F4; the mockup, "Großansicht beim Antippen"):
       who sent it and when, "Schließen", the picture over the whole screen in its proportions, its
       caption under it. No "Speichern" (E-044 F4).

       ⛔ A dialog STACKED on the contact window, as the file hint and the video question are --
       not an overlay of its own at <body>, as AvatarZoom is. Measured in Chrome (P7c): the contact
       window's focus trap pulls the focus back out of any element outside it, and an Esc then
       closed the contact window as well. A second BModal is a second trap on the same stack: the
       window's trap pauses while this one is open, Esc closes this one only, and the focus goes
       back to where it was when this one opened -- the picture in its bubble. BModal brings the
       rest: it is put at <body>, `role="dialog"`, the page behind does not scroll. `aria-modal` it
       does not set (bootstrap-vue-next 0.26.8: only its offcanvas does), so it is written here and
       lands on the dialog's element, as `aria-label` does. -->
  <BModal
    :model-value="open"
    fullscreen
    no-header
    no-footer
    :autofocus="false"
    aria-modal="true"
    :aria-label="title"
    content-class="chat-image-view-content"
    body-class="chat-image-view-body"
    data-test="chat-image-view"
    @update:model-value="onModel"
    @shown="focusClose"
    @hidden="letGo"
  >
    <div v-if="shown" class="chat-image-view" @click.self="close">
      <div class="chat-image-view-bar" @click.self="close">
        <div class="chat-image-view-who" data-test="chat-image-view-who">
          {{ shown.who }}
          <small data-test="chat-image-view-when">{{ when }}</small>
        </div>
        <button
          ref="closeButton"
          type="button"
          class="chat-image-view-close"
          :aria-label="t('form.close')"
          :title="t('form.close')"
          data-test="chat-image-view-close"
          @click="close"
        >
          <i-mdi-close class="chat-image-view-close-icon" aria-hidden="true" />
        </button>
      </div>
      <div class="chat-image-view-stage" :style="measure" @click.self="close">
        <img
          v-if="src"
          class="chat-image-view-picture"
          :src="src"
          :width="shown.width"
          :height="shown.height"
          alt=""
          data-test="chat-image-view-picture"
        />
        <span v-else class="chat-image-view-waiting" data-test="chat-image-view-waiting" />
      </div>
      <div v-if="shown.caption" class="chat-image-view-caption" data-test="chat-image-view-caption">
        <chat-message-text :text="shown.caption" />
      </div>
    </div>
  </BModal>
</template>

<script setup>
import { computed, nextTick, onBeforeUnmount, ref, shallowRef, watch } from 'vue'
import { useI18n } from 'vue-i18n'
import { BModal } from 'bootstrap-vue-next'
import { useApolloClient } from '@vue/apollo-composable'
import ChatMessageText from '@/components/Chat/ChatMessageText'
import {
  chatImage,
  chatImageViewState,
  closeChatImageView,
  requestChatImage,
} from '@/composables/useChatImages'

/**
 * The one large view of a thread, driven from useChatImages (`openChatImageView`), so the logout
 * can close it wherever it is (store.js, beside closeAvatarZoom).
 */
const { t, d } = useI18n()
const { client } = useApolloClient()

/**
 * What is shown -- held here until the dialog has faded out, so the picture does not vanish from
 * a dialog still on its way out. Taken from the shared state when it opens.
 */
const shown = shallowRef(null)
const open = computed(() => Boolean(chatImageViewState.value))
watch(
  chatImageViewState,
  (view) => {
    if (!view) return
    shown.value = view
    // Here or on its way already, as a rule -- its bubble was in sight to be tapped. Where its
    // question failed, it is asked once more.
    requestChatImage(client, view.imageUuid)
  },
  { immediate: true },
)

const src = computed(() => {
  const known = shown.value ? chatImage(shown.value.imageUuid) : null
  return known?.state === 'ready' ? known.src : null
})

/** "Bild von {name}": the dialog's name, as it has no header of its own. */
const title = computed(() =>
  shown.value ? t('chatThread.imageViewTitle', { name: shown.value.name }) : '',
)

/** When it arrived on this server (E-018), day and time, as the thread says them. */
const when = computed(() => {
  if (!shown.value) return ''
  const at = new Date(shown.value.at)
  return `${d(at, 'short')}, ${d(at, 'time')}`
})

/**
 * The picture's proportions, and twice its size, for the stylesheet: on a phone it grows to fill
 * the screen; at the desk it stops at twice its size -- a picture of 800 pixels blown up to a large
 * screen shows its blocks, not its subject.
 */
const measure = computed(() =>
  shown.value
    ? {
        '--chat-image-ratio': String(shown.value.width / shown.value.height),
        '--chat-image-twice': `${shown.value.width * 2}px`,
      }
    : {},
)

const closeButton = ref(null)

/** The focus on "Schließen" once the dialog is there -- the one control it has. */
const focusClose = () => closeButton.value?.focus({ preventScroll: true })

const close = () => closeChatImageView()

/** Esc, or anything else the dialog closes on itself. */
const onModel = (value) => {
  if (!value) closeChatImageView()
}

/**
 * Gone: the focus back to the picture in its bubble -- not left on <body>, which a browser that
 * does not focus a tapped button (Safari) would leave it on. A bubble that has gone meanwhile takes
 * no focus, and the focus stays where it is.
 */
const letGo = async () => {
  const opener = shown.value?.opener
  shown.value = null
  await nextTick()
  opener?.focus({ preventScroll: true })
}

// ⛔ The state lives at module level and outlives this view: closing it with the view keeps a
// picture from opening by itself the next time a thread is made.
onBeforeUnmount(closeChatImageView)
</script>

<style lang="scss">
/* Not scoped: the dialog's content and body are BModal's elements, which carry no scope of this
   file. Each rule names BModal's own class beside ours, and the content's goes higher still: dark
   mode sets `.dark-mode .modal-content` with `!important` (gradido-template-dark.scss), and a tie
   would go to whichever stylesheet came last.

   The ground covers all: at 94 %, as on the test bench, the light contact window behind it showed
   through with its words readable on a phone (measured, P7c). */
.modal .modal-content.chat-image-view-content {
  border: 0;
  background-color: rgb(10 10 12) !important;
  color: #f1f0ec;
}

.modal .modal-body.chat-image-view-body {
  display: flex;
  padding: 0;
  overflow: hidden;
}

.chat-image-view {
  display: flex;
  flex: 1 1 auto;
  flex-direction: column;
  min-width: 0;
  min-height: 0;
}

/* Who sent it and when, "Schließen" at the right. */
.chat-image-view-bar {
  display: flex;
  flex: 0 0 auto;
  align-items: center;
  gap: 0.75rem;
  padding: 0.75rem 1rem;
}

.chat-image-view-who {
  flex: 1 1 auto;
  min-width: 0;
  font-size: 0.95rem;
  font-weight: 600;
  line-height: 1.3;
  overflow-wrap: anywhere;
}

.chat-image-view-who small {
  display: block;
  color: #b9b8b2;
  font-weight: 400;
}

/* Round, 44 px -- a finger's size -- a light rim on the dark ground. */
.chat-image-view-close {
  display: inline-flex;
  flex: 0 0 auto;
  align-items: center;
  justify-content: center;
  width: 2.75rem;
  height: 2.75rem;
  padding: 0;
  border: 1px solid #5c5b57;
  border-radius: 50%;
  background: transparent;
  color: #f1f0ec;
  cursor: pointer;
}

.chat-image-view-close:focus-visible {
  outline: 2px solid #f1f0ec;
  outline-offset: 2px;
}

.chat-image-view-close-icon {
  width: 1.3rem;
  height: 1.3rem;
}

/* The picture takes the room between the bar and the caption, whole, in its proportions: as wide
   as the room allows or as high, whichever comes first (container units of the stage). Its box is
   the picture itself, so a tap beside it lands on the ground and closes the view. */
.chat-image-view-stage {
  display: flex;
  flex: 1 1 auto;
  align-items: center;
  justify-content: center;
  min-height: 0;
  padding: 0 0.5rem;
  container-type: size;
}

.chat-image-view-picture,
.chat-image-view-waiting {
  display: block;
  width: min(100cqw, 100cqh * var(--chat-image-ratio, 1));
  height: auto;
  aspect-ratio: var(--chat-image-ratio, 1);
}

/* At the desk at most twice its size (see `measure`); the house's own switch from the sheet to
   the desk, LG_BREAKPOINT_PX. */
@media (width >= 1025px) {
  .chat-image-view-picture,
  .chat-image-view-waiting {
    width: min(100cqw, 100cqh * var(--chat-image-ratio, 1), var(--chat-image-twice, 100cqw));
  }
}

/* Until the picture has come: a quiet surface of its size. */
.chat-image-view-waiting {
  background: rgb(255 255 255 / 8%);
}

.chat-image-view-caption {
  flex: 0 0 auto;
  max-height: 30vh;
  padding: 0.75rem 1rem 1.25rem;
  overflow-y: auto;
  font-size: 0.95rem;
  white-space: pre-wrap;
  overflow-wrap: anywhere;
}

/* A link in the caption in the dark theme's green (`--link`, gradido-template-dark.scss), in both
   themes: the view is dark in both, and the light theme's #047006 came to 2.81:1 on this ground
   (measured, P7c). Written out, as the view does not stand inside `.dark-mode` in the light theme;
   darkModeLinkGreen.spec holds the two equal. A file card keeps its own colours on its own surface.
   The copy button behind a video link is drawn in the link's colour (ChatVideoLinkCopy), so here
   in the same green. */
.modal .chat-image-view-caption :is(a:not(.chat-file-card), .chat-video-link-copy) {
  color: #3db85f;
}
</style>
