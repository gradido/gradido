<!-- AI-GENERATED — not an architecture reference -->
<template>
  <!-- The picture of a message, in its bubble (E-044 F3/F5; the mockup, "Bilder im Faden"): as
       large as a greeting's picture stands, and whole (Bernd, 17.10.2026) -- a tall screenshot
       shows its top, and all of it in the large view a tap opens. A button, because a tap on it
       does something. -->
  <div
    v-if="missing"
    ref="root"
    class="chat-bubble-image is-missing"
    :style="[room, size]"
    data-test="chat-bubble-image-missing"
  >
    {{ t('chatThread.imageMissing') }}
  </div>
  <button
    v-else
    ref="root"
    type="button"
    class="chat-bubble-image"
    :aria-label="t('chatThread.imageOpen')"
    :title="t('chatThread.imageOpen')"
    :style="size"
    data-test="chat-bubble-image"
    @click="emit('open', $event.currentTarget)"
  >
    <!-- ⛔ Width and height from the message, as attributes and as its proportions: the bubble
         has its size before the picture has come, so nothing below it jumps when it does. Until
         then a quiet surface -- no spinner. `alt=""`: the button names what it does, and the
         caption under it says what the picture is about, where the sender wrote one. -->
    <img
      class="chat-bubble-image-picture"
      :class="{ 'is-waiting': !src }"
      :src="src || undefined"
      :width="image.width"
      :height="image.height"
      :style="room"
      alt=""
      data-test="chat-bubble-image-picture"
    />
  </button>
</template>

<script setup>
import { computed, onBeforeUnmount, onMounted, ref } from 'vue'
import { useI18n } from 'vue-i18n'
import { useApolloClient } from '@vue/apollo-composable'
import { chatImage, requestChatImage } from '@/composables/useChatImages'

/**
 * The picture of one chat message, fetched when its bubble comes into sight (useChatImages) and
 * shown in the room its size gives it. `open` says the member wants it large, with the button
 * that was pressed, which the large view hands the focus back to.
 */
const props = defineProps({
  /** One of `message.images`: `{ imageUuid, width, height }`. */
  image: { type: Object, required: true },
})

const emit = defineEmits(['open'])

const { t } = useI18n()
const { client } = useApolloClient()

const root = ref(null)
const known = computed(() => chatImage(props.image.imageUuid))
const src = computed(() => (known.value?.state === 'ready' ? known.value.src : null))
/** The server gave nothing for it -- "Bild nicht verfügbar", in the room the picture would have had. */
const missing = computed(() => known.value?.state === 'missing')

/** The picture's proportions, for the room it is given before and after it has come. */
const room = computed(() => ({ aspectRatio: `${props.image.width} / ${props.image.height}` }))

/**
 * Its proportions as a number, and twice its size, for the width the stylesheet gives it -- the
 * names and the measure the large view has (ChatImageView).
 */
const size = computed(() => ({
  '--chat-image-ratio': String(props.image.width / props.image.height),
  '--chat-image-twice': `${props.image.width * 2}px`,
}))

const request = () => requestChatImage(client, props.image.imageUuid)

/**
 * Asked for once its bubble is in sight: a long thread opened at its end does not fetch the
 * pictures of its beginning. Where the browser has no IntersectionObserver, when it is drawn. A
 * picture that is here or on its way already is not asked for again (useChatImages).
 */
let watcher = null
onMounted(() => {
  if (typeof IntersectionObserver === 'undefined') {
    request()
    return
  }
  watcher = new IntersectionObserver((entries) => {
    if (!entries.some((entry) => entry.isIntersecting)) return
    watcher?.disconnect()
    watcher = null
    request()
  })
  watcher.observe(root.value)
})
onBeforeUnmount(() => watcher?.disconnect())
</script>

<style lang="scss" scoped>
/* As large as the picture of a greeting stands (Bernd, 17.10.2026): as wide as a bubble may be,
   80 % of the thread (ChatBubble), and whole -- no higher than `--chat-image-height`, which is
   22rem in the usual window and up to a greeting's height in the large one (ChatWindowSizeToggle).
   A picture higher than wide stands at that height and is narrower.

   Only a picture that would then be narrower than 16rem -- a long screenshot -- stays 16rem wide
   and is cut at the bottom, its top in sight (E-044 F5). And at most twice its own size, as in the
   large view -- a small picture blown up to a bubble's width shows its blocks, not its subject --,
   but never narrower than those 16rem: a picture under 8rem wide stands 16rem wide, as it always
   did. The floor wins over the cap (`max` outside `min`).

   ⛔ The width is a length, never a percentage. It is what the picture asks of the bubble while
   the bubble works out how wide it wants to be, and the bubble grows to it -- up to its 80 %,
   where `max-width` takes the picture in (a percentage there does not count while the bubble is
   measured). A width in percent would count as `auto`, and the picture would ask for its own
   pixels. A long caption makes the bubble wider than its picture; the picture stays at the top,
   at the bubble's start (Bernd, 17.10.2026, in the morning).

   The corners a little rounder than the bubble's padding. */
.chat-bubble-image {
  display: block;
  width: max(
    16rem,
    min(var(--chat-image-twice), var(--chat-image-height, 22rem) * var(--chat-image-ratio))
  );
  max-width: 100%;
  padding: 0;
  overflow: hidden;
  border: 0;
  border-radius: 0.6rem;
  background: transparent;
  cursor: zoom-in;
}

.chat-bubble-image:focus-visible {
  outline: 2px solid var(--success, #047006);
  outline-offset: 2px;
}

/* At most as high as the window lets a picture be; one that is higher at 16rem wide is cut at the
   bottom, its top in sight (E-044 F5). */
.chat-bubble-image-picture {
  display: block;
  width: 100%;
  height: auto;
  max-height: var(--chat-image-height, 22rem);
  object-fit: cover;
  object-position: top;
}

/* Until the picture has come: a quiet surface of its size, as light on the dark bubbles as it is
   dark on the light ones. */
.chat-bubble-image-picture.is-waiting,
.chat-bubble-image.is-missing {
  background: rgb(127 127 127 / 18%);
}

.chat-bubble-image.is-missing {
  display: flex;
  align-items: center;
  justify-content: center;
  max-height: var(--chat-image-height, 22rem);
  padding: 0.5rem;
  font-size: 0.8rem;
  text-align: center;
  cursor: default;
}
</style>
