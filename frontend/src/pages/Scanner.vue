<!-- AI-GENERATED — not an architecture reference -->
<template>
  <div class="scanner" data-test="scanner">
    <!-- The head is the page's own chrome, like the calculator's: the route is bareChrome,
         so on a phone this arrow is the only way out. 44px target, pressed one-handed. -->
    <div class="scanner-head">
      <button
        type="button"
        class="scanner-head-key"
        :aria-label="$t('scanner.back')"
        data-test="scanner-back"
        @click="goBack"
      >
        <IMdiArrowLeft />
      </button>
      <div class="scanner-title">{{ $t('scanner.title') }}</div>
    </div>

    <!-- ── The viewfinder ─────────────────────────────────────────────────────────── -->
    <!-- Also rendered while idle (camera stopped for a hidden tab or an open foreign
         card): the video element has to survive those moments, or there would be nothing
         to restart the camera into. -->
    <template v-if="!fallbackView">
      <div class="scanner-frame">
        <!-- playsinline keeps iOS from going fullscreen; muted is what allows play()
             without a gesture on every platform this runs on. -->
        <video ref="videoElement" class="scanner-video" autoplay muted playsinline />
        <span class="scanner-corner scanner-corner-tl" aria-hidden="true" />
        <span class="scanner-corner scanner-corner-tr" aria-hidden="true" />
        <span class="scanner-corner scanner-corner-bl" aria-hidden="true" />
        <span class="scanner-corner scanner-corner-br" aria-hidden="true" />
      </div>

      <div class="scanner-hint" data-test="scanner-hint">{{ $t('scanner.hint') }}</div>

      <!-- Visible WHILE the camera runs, deliberately: the moment somebody realises the
           code will not read (glare, a worn card) must not force them back out. -->
      <button
        type="button"
        class="scanner-manual-link"
        data-test="scanner-manual-open"
        @click="openManual"
      >
        {{ $t('scanner.manual.open') }}
      </button>

      <!-- From the second start in this browser session on: the permission question has
           just come back, and this is the moment somebody wants to know how to make it
           stop. See repeatedOpen. -->
      <div v-if="repeatedOpen" class="scanner-permission-hint" data-test="scanner-permission-hint">
        {{ $t('scanner.permission-hint') }}
      </div>

      <!-- "No Gradido code": an answer, not an alarm. It shows briefly and scanning just
           continues; the same unknown code re-announces itself only after the lock below
           runs out, so a code held into the picture does not flicker this at 10/s. -->
      <div v-if="unknownShown" class="scanner-unknown" data-test="scanner-unknown">
        {{ $t('scanner.no-gradido-code') }}
      </div>
    </template>

    <!-- ── Camera refused or missing ──────────────────────────────────────────────── -->
    <!-- No reproach: one sentence about the remedy, then the two old ways as cards.
         Both ways keep working forever — the scanner is an addition, not a toll gate. -->
    <template v-else>
      <div class="scanner-denied" data-test="scanner-denied">
        <div class="scanner-denied-title">
          {{ state === 'denied' ? $t('scanner.denied.title') : $t('scanner.unavailable.title') }}
        </div>
        <div v-if="state === 'denied'" class="scanner-denied-help">
          {{ $t('scanner.denied.help') }}
        </div>

        <div class="scanner-way-card">
          <div class="scanner-way-title">
            <IMdiCellphone class="scanner-way-icon" />
            {{ $t('scanner.system-camera.title') }}
          </div>
          <div class="scanner-way-text">{{ $t('scanner.system-camera.text') }}</div>
          <!-- Only when an amount actually waits: said unconditionally, this sentence
               would promise a prefilled field to somebody who never parked anything. -->
          <div v-if="parkedWaiting" class="scanner-way-parked" data-test="scanner-parked-waiting">
            {{ $t('scanner.system-camera.parked') }}
          </div>
        </div>

        <div class="scanner-way-card">
          <div class="scanner-way-title">
            <IMdiKeyboardOutline class="scanner-way-icon" />
            {{ $t('scanner.manual.open') }}
          </div>
          <form class="scanner-manual-form" @submit.prevent="submitManual">
            <label class="visually-hidden" for="scanner-manual-inline">
              {{ $t('scanner.manual.label') }}
            </label>
            <!-- Codes are case-sensitive and no words: the device keyboard must neither
                 capitalize nor "correct" them, or the person types exactly what the card
                 says and still lands on "link invalid". -->
            <BFormInput
              id="scanner-manual-inline"
              v-model="manualText"
              type="text"
              autocapitalize="none"
              autocorrect="off"
              spellcheck="false"
              inputmode="url"
              :placeholder="$t('scanner.manual.label')"
              data-test="scanner-manual-input"
            />
            <BButton type="submit" variant="gradido" data-test="scanner-manual-submit">
              {{ $t('scanner.manual.submit') }}
            </BButton>
          </form>
          <div
            v-if="manualInvalid"
            class="scanner-manual-invalid"
            data-test="scanner-manual-invalid"
          >
            {{ $t('scanner.manual.invalid') }}
          </div>
        </div>
      </div>
    </template>

    <!-- ── Foreign community: the slid-up confirmation card ───────────────────────── -->
    <!--
      ⛔ Why this card exists at all — and why it is the ONLY way a foreign link opens:

      Reading codes of OTHER communities is the point of the network (federation): the
      classic case is the thank-you card of another community at the counter. The card is
      NOT distrust of communities — it is distrust of stickers. A code pasted over a real
      one looks identical through a viewfinder, and the jump it triggers leaves this
      wallet along with its login. So the person sees the HOST they are about to visit,
      confirms with one press, and only that press navigates. The own origin, by
      contrast, passes wordlessly — nothing is left to confirm when nothing is left.
    -->
    <div v-if="foreignTarget" class="scanner-sheet" data-test="scanner-foreign">
      <div class="scanner-sheet-title">
        <IMdiWeb class="scanner-sheet-icon" />
        <!-- eslint-disable-next-line @intlify/vue-i18n/no-dynamic-keys-->
        {{ $t(`scanner.foreign.${foreignTarget.kind}`) }}
      </div>
      <div class="scanner-sheet-host" data-test="scanner-foreign-host">
        {{ foreignTarget.host }}
      </div>
      <BButton
        variant="gradido"
        class="w-100"
        data-test="scanner-foreign-open"
        @click="openForeign"
      >
        {{ $t('scanner.foreign.open') }}
      </BButton>
      <button
        type="button"
        class="scanner-sheet-dismiss"
        data-test="scanner-foreign-continue"
        @click="continueScanning"
      >
        {{ $t('scanner.foreign.continue') }}
      </button>
    </div>

    <!-- ── Hand entry over the running viewfinder ─────────────────────────────────── -->
    <!-- Gone in the fallback view, where the same form sits inline — two rendered forms
         would answer the same data-test twice. -->
    <div v-if="manualOpen && !fallbackView" class="scanner-sheet" data-test="scanner-manual">
      <form class="scanner-manual-form" @submit.prevent="submitManual">
        <label class="scanner-sheet-label" for="scanner-manual-sheet">
          {{ $t('scanner.manual.label') }}
        </label>
        <!-- Same keyboard discipline as the inline twin: codes are case-sensitive. -->
        <BFormInput
          id="scanner-manual-sheet"
          v-model="manualText"
          type="text"
          autocapitalize="none"
          autocorrect="off"
          spellcheck="false"
          inputmode="url"
          data-test="scanner-manual-input"
        />
        <BButton type="submit" variant="gradido" class="w-100" data-test="scanner-manual-submit">
          {{ $t('scanner.manual.submit') }}
        </BButton>
      </form>
      <div v-if="manualInvalid" class="scanner-manual-invalid" data-test="scanner-manual-invalid">
        {{ $t('scanner.manual.invalid') }}
      </div>
      <button
        type="button"
        class="scanner-sheet-dismiss"
        data-test="scanner-manual-close"
        @click="closeManual"
      >
        {{ $t('scanner.manual.close') }}
      </button>
    </div>
  </div>
</template>

<script setup>
/**
 * The QR scanner, as a page of the wallet.
 *
 * ## What it is for
 *
 * One tool for every Gradido code — thank-you card, cheque, Gradido card/address — so the
 * till workflow never has to leave the wallet again. It is reachable on its own (the
 * quick symbol next to the calculator's) and as the second half of the calculator's
 * "with thank-you card" act: park the amount, open the camera.
 *
 * ## Where the pieces live
 *
 * `useQrScanner` runs the camera and the detection loop (and its stop-everything
 * discipline); `resolveScanTarget` decides what a payload means. This page renders the
 * four views of the approved mockup and wires the two together. What a scanned code may
 * do is decided in the parser, nowhere else — this page never navigates to anything the
 * parser did not bless.
 */
import { BButton, BFormInput } from 'bootstrap-vue-next'
import { computed, onMounted, onUnmounted, ref } from 'vue'
import { useRouter } from 'vue-router'
import CONFIG from '@/config'
import { useQrScanner } from '@/composables/useQrScanner'
import { useParkedAmount } from '@/composables/useParkedAmount'
import { openExternalUrl } from '@/utils/browserLocation'
import { communityHost } from '@/utils/gradidoAddress'
import { resolveScanTarget } from '@/utils/scanTarget'

/**
 * How long the same payload stays quiet after "keep scanning" or an unknown-code note.
 * Long enough not to flicker at 10 detections/s, short enough that taking the card out
 * of the picture and holding it in again reads as the new attempt it is.
 */
const REANNOUNCE_AFTER_MS = 3000

/** How long the "no Gradido code" note stays up. */
const UNKNOWN_NOTE_MS = 2500

/**
 * Every host that means "this wallet". The serving host AND the configured community
 * host: the wallet's own printed codes carry the latter, and the browser may sit on an
 * alias of it (www vs apex, an IP-served local community — one day a Capacitor shell,
 * whose page host is no community at all). A member's own cheque must never draw the
 * foreign-community card because those two names differ. (Bernd, 21.08.2026)
 */
const OWN_HOSTS = [
  window.location.host,
  CONFIG.COMMUNITY_URL ? communityHost(CONFIG.COMMUNITY_URL) : '',
].filter(Boolean)

const router = useRouter()
const { readParked } = useParkedAmount()

const videoElement = ref(null)
const foreignTarget = ref(null)
const manualOpen = ref(false)
const manualText = ref('')
const manualInvalid = ref(false)
const unknownShown = ref(false)

/**
 * Read once on arrival: whether the calculator left an amount waiting. A plain constant,
 * deliberately — the only view that shows it (camera refused/missing) has no event that
 * could refresh it, and a ref with an unreachable refresh site just claims otherwise.
 */
const parkedWaiting = readParked() !== null

/** Counts scanner starts in this browser session; the count survives route changes only. */
const SCANNER_OPENS_KEY = 'scanner-opens'

const countScannerOpen = () => {
  try {
    const count = Number(window.sessionStorage.getItem(SCANNER_OPENS_KEY) ?? 0) + 1
    window.sessionStorage.setItem(SCANNER_OPENS_KEY, String(count))
    return count
  } catch {
    return 1
  }
}

/**
 * Whether this is at least the second scanner start in this session. Engines that tie the
 * camera grant to a live capture session (iOS Safari) ask the permission question again
 * with every start — and the wallet stops the camera on every way out on purpose, so it
 * cannot dodge the question by keeping the camera running (the light would stay on). What
 * it CAN do is tell people, exactly at the second question, that the browser's own site
 * settings allow the camera for this page for good. (Bernd, 21.08.2026)
 */
const repeatedOpen = countScannerOpen() > 1

let ignoredValue = null
let ignoredAt = 0
let unknownTimer = null

const ignoreForNow = (rawValue) => {
  ignoredValue = rawValue
  ignoredAt = Date.now()
}

const isIgnored = (rawValue) =>
  rawValue === ignoredValue && Date.now() - ignoredAt < REANNOUNCE_AFTER_MS

/**
 * ONE dispatch for every road a target arrives on — scanned or typed. The sameness of
 * those two roads is a stated security property (a person may type exactly what a
 * sticker told them to), so it lives in one function rather than two drifting copies:
 *
 * - own community → stop the camera, navigate internally. Wordlessly, by decision:
 *   there is nothing to confirm about the place somebody already is.
 * - foreign community → close whatever sheet is open, hold the loop, raise the
 *   confirmation card. Only its golden button ever opens a foreign link.
 */
const handleTarget = (target, raw) => {
  if (!target.foreign) {
    scanner.stop()
    router.push(target.path)
    return
  }
  manualOpen.value = false
  manualInvalid.value = false
  scanner.pause()
  // The RAW text rides along: the quiet-period lock compares against what the camera
  // reads, and that is the raw payload, not the normalised URL built from it.
  foreignTarget.value = { ...target, raw }
}

/** One scanned payload. The parser is the whole decision; see handleTarget. */
const onCode = (rawValue) => {
  if (isIgnored(rawValue)) {
    return
  }
  const target = resolveScanTarget(rawValue, OWN_HOSTS)
  if (!target) {
    // "No Gradido code" — an answer, not an alarm. NEVER opened.
    ignoreForNow(rawValue)
    unknownShown.value = true
    window.clearTimeout(unknownTimer)
    unknownTimer = window.setTimeout(() => {
      unknownShown.value = false
    }, UNKNOWN_NOTE_MS)
    return
  }
  handleTarget(target, rawValue)
}

const scanner = useQrScanner(onCode)
const { state } = scanner

/** The two old ways replace the viewfinder — the camera said no, or there is none. */
const fallbackView = computed(() => state.value === 'denied' || state.value === 'unavailable')

/** The confirmed jump — the only call anywhere that opens a foreign target. */
const openForeign = () => {
  const { url } = foreignTarget.value
  // The camera dies BEFORE the jump: window.location does not unmount this page, so
  // onUnmounted would never run and the light would stay on until the browser unloads.
  scanner.stop()
  openExternalUrl(url)
}

const continueScanning = () => {
  // The dismissed code stays quiet for a moment — otherwise the card still in the
  // picture would raise the sheet again on the very next tick.
  ignoreForNow(foreignTarget.value.raw)
  foreignTarget.value = null
  scanner.resume()
  // While the card was open the tab may have gone hidden, which STOPS the camera
  // rather than pausing it — a resume alone would then face a dead stream.
  if (state.value === 'idle') {
    scanner.start(videoElement.value)
  }
}

/**
 * The camera keeps running under the sheet — the picture staying live is part of the
 * tool — but the LOOP holds: a code drifting into the frame while somebody types must
 * neither navigate away mid-entry nor raise the confirmation card under this sheet.
 */
const openManual = () => {
  manualOpen.value = true
  scanner.pause()
}

const submitManual = () => {
  const target = resolveScanTarget(manualText.value, OWN_HOSTS)
  if (!target) {
    manualInvalid.value = true
    return
  }
  // A typed foreign link takes the same confirmation road as a scanned one.
  handleTarget(target, manualText.value)
}

const closeManual = () => {
  manualOpen.value = false
  manualInvalid.value = false
  scanner.resume()
}

/**
 * Same landing rule as the calculator: back to wherever the scanner was opened from,
 * and a deep link (no wallet history) lands on the overview instead of walking out of
 * the wallet.
 */
const goBack = () => {
  scanner.stop()
  if (router.options.history.state.back) {
    router.back()
  } else {
    router.push('/overview')
  }
}

// The camera starts as soon as the video element exists — onMounted is the first
// moment the ref is bound. Page visibility (hidden tabs, background-tab opens) is the
// composable's own business; this page only says when it wants a camera at all.
onMounted(() => {
  scanner.start(videoElement.value)
})

onUnmounted(() => {
  window.clearTimeout(unknownTimer)
  scanner.stop()
})
</script>

<style lang="scss" scoped>
/*
  The scanner belongs to the calculator's tool family: the same dark surface, so at a
  counter the two read as one instrument. Gold is the wallet's own accent (the gradient
  of .btn-gradido), here on the corners that say "hold it in here".

  ⛔ Custom properties on the element, NOT scss variables at the top of the block: the
  style block is parsed by lightningcss when it is bundled, and a declaration outside any
  selector fails there — which neither lint nor the tests catch, only `bun run build`.
*/
.scanner {
  --scan-surface: rgb(40 40 40);
  --scan-ink: rgb(255 253 253);
  --scan-dim: rgb(150 150 150);
  --scan-gold: rgb(249 205 105);
  --scan-green: rgb(132 174 116);

  position: relative;
  max-width: 480px;

  /* The pair, not just dvh: engines without dvh (iOS Safari 15.0-15.3, older
     Chromium) drop the second line entirely and the dark surface would collapse to
     content height. Same deliberate fallback as MatchingMap. */
  min-height: 100vh;
  min-height: 100dvh;
  margin: 0 auto;
  padding-bottom: 24px;
  color: var(--scan-ink);
  background-color: var(--scan-surface);
  border-radius: 12px;
  overflow: hidden;
}

.scanner-head {
  display: flex;
  align-items: center;
  padding: 4px 8px;
}

/* 44px stays the target even though the icon reads small -- same rule as the calculator. */
.scanner-head-key {
  width: 44px;
  height: 44px;
  display: flex;
  align-items: center;
  justify-content: center;
  font-size: 24px;
  color: var(--scan-dim);
  background: transparent;
  border: none;
  cursor: pointer;
}

.scanner-head-key:hover {
  color: rgb(210 210 210);
}

.scanner-title {
  font-size: 18px;
}

.scanner-frame {
  position: relative;
  margin: 12px 24px;
  aspect-ratio: 1;
}

.scanner-video {
  width: 100%;
  height: 100%;
  object-fit: cover;
  border-radius: 12px;
  background-color: rgb(20 22 18);
}

/* The four golden corners: the frame that says where the code goes. Drawn as corners
   rather than a border so the picture stays open — a closed box reads as "too small". */
.scanner-corner {
  position: absolute;
  width: 34px;
  height: 34px;
  border: 3px solid var(--scan-gold);
  pointer-events: none;
}

.scanner-corner-tl {
  top: 0;
  left: 0;
  border-right: none;
  border-bottom: none;
  border-top-left-radius: 12px;
}

.scanner-corner-tr {
  top: 0;
  right: 0;
  border-left: none;
  border-bottom: none;
  border-top-right-radius: 12px;
}

.scanner-corner-bl {
  bottom: 0;
  left: 0;
  border-right: none;
  border-top: none;
  border-bottom-left-radius: 12px;
}

.scanner-corner-br {
  bottom: 0;
  right: 0;
  border-left: none;
  border-top: none;
  border-bottom-right-radius: 12px;
}

.scanner-hint {
  padding: 0 24px;
  font-size: 14px;
  text-align: center;
  color: var(--scan-dim);
}

.scanner-manual-link {
  display: block;
  margin: 14px auto 0;
  padding: 10px;
  font-size: 14px;
  color: var(--scan-ink);
  text-decoration: underline;
  background: transparent;
  border: none;
  cursor: pointer;
}

.scanner-permission-hint {
  margin: 6px 24px 0;
  font-size: 12px;
  line-height: 1.35;
  text-align: center;
  color: var(--scan-dim);
}

.scanner-unknown {
  margin: 10px 24px 0;
  padding: 8px 12px;
  font-size: 14px;
  text-align: center;
  color: var(--scan-ink);
  background-color: rgb(60 60 60);
  border-radius: 8px;
}

.scanner-denied {
  padding: 8px 20px;
}

.scanner-denied-title {
  font-size: 17px;
}

.scanner-denied-help {
  margin-top: 6px;
  font-size: 14px;
  color: var(--scan-dim);
}

.scanner-way-card {
  margin-top: 16px;
  padding: 14px 16px;
  background-color: rgb(55 55 55);
  border-radius: 12px;
}

.scanner-way-title {
  display: flex;
  align-items: center;
  gap: 8px;
  font-size: 15px;
}

.scanner-way-icon {
  font-size: 20px;
  color: var(--scan-dim);
}

.scanner-way-text {
  margin-top: 6px;
  font-size: 14px;
  color: var(--scan-dim);
}

.scanner-way-parked {
  margin-top: 6px;
  font-size: 14px;
  color: var(--scan-green);
}

/* The slid-up card at the bottom — confirmation and hand entry share the shape. */
.scanner-sheet {
  position: absolute;
  left: 0;
  right: 0;
  bottom: 0;
  padding: 18px 20px 16px;
  background-color: rgb(28 28 28);
  border-top-left-radius: 16px;
  border-top-right-radius: 16px;
  box-shadow: 0 -8px 30px rgb(0 0 0 / 45%);
}

.scanner-sheet-title {
  display: flex;
  align-items: center;
  gap: 8px;
  font-size: 15px;
}

.scanner-sheet-icon {
  font-size: 20px;
  color: var(--scan-dim);
}

/* The host in green: it is the one thing to actually read before pressing gold. */
.scanner-sheet-host {
  margin: 8px 0 14px;
  font-size: 17px;
  overflow-wrap: anywhere;
  color: var(--scan-green);
}

.scanner-sheet-label {
  display: block;
  margin-bottom: 6px;
  font-size: 14px;
  color: var(--scan-dim);
}

.scanner-sheet-dismiss {
  display: block;
  width: 100%;
  margin-top: 10px;
  padding: 10px;
  font-size: 14px;
  color: var(--scan-dim);
  text-align: center;
  background: transparent;
  border: none;
  cursor: pointer;
}

.scanner-sheet-dismiss:hover {
  color: var(--scan-ink);
}

.scanner-manual-form {
  display: flex;
  flex-direction: column;
  gap: 10px;
  margin-top: 10px;
}

.scanner-manual-invalid {
  margin-top: 8px;
  font-size: 14px;
  color: rgb(228 132 120);
}
</style>
