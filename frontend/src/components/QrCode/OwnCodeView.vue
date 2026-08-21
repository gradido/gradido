<!-- AI-GENERATED — not an architecture reference -->
<template>
  <div class="own-code-view">
    <!-- The page's own chrome, like the scanner's and the calculator's: the route is
         bareChrome, so on a phone this arrow is the only way out. 44px target. -->
    <div class="own-code-head">
      <button
        type="button"
        class="own-code-back"
        :aria-label="$t('my-codes.back')"
        data-test="own-code-back"
        @click="goBack"
      >
        <IMdiArrowLeft />
      </button>
      <div class="own-code-title">{{ title }}</div>
    </div>

    <div class="own-code-body">
      <slot name="above" />

      <img
        v-if="picture"
        :src="picture"
        class="own-code-picture"
        :alt="title"
        data-test="own-code-picture"
      />

      <slot />
    </div>
  </div>
</template>

<script setup>
/**
 * A member's own code, big enough to be read off the screen at a counter.
 *
 * ## Why it is a page and not a dialogue
 *
 * The gesture is "hold up my square", and the phone gets turned around while it happens.
 * A dialogue would keep the wallet behind it, with the member's balance and name on the
 * screen that is being handed over. `bareChrome` takes all of that away and leaves the
 * code -- which is also the only way the code gets the width it needs on a phone.
 *
 * ## The drawing
 *
 * The same generator as everywhere else (`utils/qrCode`), so the code on the screen and
 * the code on the paper are the same picture. Not a second one, deliberately: two
 * generators are how a shown code and a printed one start to disagree.
 *
 * ⚠️ The round counter is not decoration. `link` arrives late on the thank-you card --
 * empty first, then filled when the query answers -- so there is a real transition, and
 * two draws can be in flight at once on a slow device. Whichever finishes LAST would
 * otherwise write, and that is not necessarily the current one.
 */
import { ref, watch } from 'vue'
import { useRouter } from 'vue-router'
import { renderQrCodeCanvas } from '@/utils/qrCode'

const props = defineProps({
  title: { type: String, required: true },
  // May be empty: the thank-you card has none until its card is known, and none at all
  // while the card function is switched off.
  link: { type: String, default: '' },
})

const router = useRouter()
const picture = ref('')

let round = 0

const draw = async (link) => {
  const mine = ++round
  if (!link) {
    picture.value = ''
    return
  }
  try {
    const canvas = await renderQrCodeCanvas(link)
    if (mine === round) {
      picture.value = canvas.toDataURL('image/png')
    }
  } catch {
    // The coin in the middle of the code is fetched from our own server, so this only
    // happens when the wallet's own assets are unreachable. Showing nothing is the
    // honest outcome; the page's own text stays, and the way out stays.
    if (mine === round) {
      picture.value = ''
    }
  }
}

watch(() => props.link, draw, { immediate: true })

/**
 * Back where they came from, and to the overview when there is no "came from" -- the
 * page can be opened straight from a bookmark or a typed address.
 */
const goBack = () => {
  if (router.options.history.state.back) {
    router.back()
  } else {
    router.push('/overview')
  }
}
</script>

<style lang="scss" scoped>
/* Block comments only: lightningcss parses SFC style blocks and a double slash is not a
   comment to it -- the build fails with "Invalid empty selector". */
.own-code-head {
  display: flex;
  align-items: center;
  padding: 4px 8px;
}

.own-code-back {
  width: 44px;
  height: 44px;
  display: flex;
  align-items: center;
  justify-content: center;
  font-size: 24px;
  color: inherit;
  background: transparent;
  border: none;
  cursor: pointer;
  opacity: 0.65;
}

.own-code-back:hover {
  opacity: 1;
}

.own-code-title {
  font-size: 18px;
}

.own-code-body {
  display: flex;
  flex-direction: column;
  align-items: center;
  text-align: center;
  padding: 8px 16px 32px;
}

/* White behind the code, always. A dark page would leave a scanner nothing to read, and
   the surroundings are not this component's to guess. */
.own-code-picture {
  width: min(86vw, 380px);
  max-width: 100%;
  height: auto;
  background: #fff;
  border-radius: 8px;
  padding: 8px;
}
</style>
