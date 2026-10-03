<!-- AI-GENERATED — not an architecture reference -->
<template>
  <!-- The photo of a thank-you greeting in its small rendition, in a place the member has a right
       to see it after the link is made: the list of one's own links, and the bubble of the
       booking in the conversation (ZE-019). Asked for by the id of the link once the place is in
       sight (useGreetingPictures), as a chat's picture is.

       The size and the corners are the place's own: the class the parent writes on this lands on
       whichever element stands here. The room is there before the photo has come, in the colour
       of the card -- and stays so where none comes. -->
  <img
    v-if="src"
    class="thank-you-greeting-photo"
    :src="src"
    :alt="alt"
    :width="THANK_YOU_MOTIF_WIDTH"
    :height="THANK_YOU_MOTIF_HEIGHT"
    data-test="thank-you-greeting-photo"
  />
  <span
    v-else
    ref="room"
    class="thank-you-greeting-photo is-waiting"
    :class="{ 'is-missing': missing }"
    data-test="thank-you-greeting-photo-room"
  >
    <!-- The server gave nothing for it: the sentence the chat says of a picture that is gone --
         in the room itself where the room is large enough to hold it (`says-missing`). -->
    <span v-if="missing && saysMissing" class="thank-you-greeting-photo-missing">
      {{ t('chatThread.imageMissing') }}
    </span>
  </span>
</template>

<script setup>
import { computed, onBeforeUnmount, onMounted, ref } from 'vue'
import { useI18n } from 'vue-i18n'
import { useApolloClient } from '@vue/apollo-composable'
import { greetingPicture, requestGreetingPicture } from '@/composables/useGreetingPictures'
import { THANK_YOU_MOTIF_HEIGHT, THANK_YOU_MOTIF_WIDTH } from '@/utils/thankYouMotifs'

const props = defineProps({
  /** The id of the link the greeting was made as: what the server serves the photo by. */
  linkId: { type: Number, default: null },
  /** "Foto von {name}", with the user name of whoever sent the greeting. */
  alt: { type: String, required: true },
  /** Whether "Bild nicht verfügbar" stands in the room itself -- not in one as small as a list's. */
  saysMissing: { type: Boolean, default: false },
})

const { t } = useI18n()
const { client } = useApolloClient()

const room = ref(null)
const known = computed(() => greetingPicture(props.linkId))
const src = computed(() => (known.value?.state === 'ready' ? known.value.src : null))
const missing = computed(() => known.value?.state === 'missing')

const request = () => requestGreetingPicture(client, props.linkId)

/**
 * Asked for once its place is in sight: a long conversation opened at its end does not fetch the
 * photos of its beginning. Where the browser has no IntersectionObserver, when it is drawn. A
 * photo that is here or on its way already is not asked for again (useGreetingPictures).
 */
let watcher = null
onMounted(() => {
  // Here already -- one's own, kept from what the wallet sent, or fetched before.
  if (!room.value) return
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
  watcher.observe(room.value)
})
onBeforeUnmount(() => watcher?.disconnect())
</script>

<style lang="scss" scoped>
/* Block comments only: lightningcss parses SFC style blocks and a double slash is not a
   comment to it.

   The photo fills its place as a motif does. The two renditions are 36 : 25 to a pixel's
   rounding; `cover` takes that pixel instead of stretching the picture. */
.thank-you-greeting-photo {
  object-fit: cover;
}

/* Until the photo has come the room is a box of its own, not an empty run of text: it takes the
   size its place gives it, and it is in sight as soon as any part of that place is -- an empty
   inline element is a point at its top left corner, and the photo of a bubble whose top had
   scrolled out of the thread was not asked for (measured in the built wallet, 03.10.2026). */
.thank-you-greeting-photo.is-waiting {
  display: block;
}

/* "Bild nicht verfügbar", in the middle of the room -- on the card's ground, which is light in
   both themes: its own colour. */
.thank-you-greeting-photo.is-waiting.is-missing {
  display: flex;
  align-items: center;
  justify-content: center;
}

.thank-you-greeting-photo-missing {
  padding: 0.5rem;
  color: #6b5a3a;
  font-size: 0.8rem;
  text-align: center;
}
</style>
