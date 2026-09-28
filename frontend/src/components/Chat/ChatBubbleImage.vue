<!-- AI-GENERATED — not an architecture reference -->
<template>
  <!-- The picture of a message, in its bubble (E-044 F3/F5; the mockup, "Bilder im Faden"): the
       width of the bubble, at most 22rem high -- a tall screenshot shows its top, and all of it in
       the large view a tap opens. A button, because a tap on it does something. -->
  <div
    v-if="missing"
    ref="root"
    class="chat-bubble-image is-missing"
    :style="room"
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
/* As wide as the bubble, the corners a little rounder than the bubble's padding. */
.chat-bubble-image {
  display: block;
  width: 100%;
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

/* At most 22rem high; a taller picture is cut at the bottom, its top in sight (E-044 F5). */
.chat-bubble-image-picture {
  display: block;
  width: 100%;
  height: auto;
  max-height: 22rem;
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
  max-height: 22rem;
  padding: 0.5rem;
  font-size: 0.8rem;
  text-align: center;
  cursor: default;
}
</style>
