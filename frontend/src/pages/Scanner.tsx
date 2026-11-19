// AI-GENERATED — not an architecture reference
import { BButton, BFormInput, type ButtonVariant } from 'bootstrap-vue-next'
import { computed, defineComponent, onMounted, onUnmounted, ref, withModifiers } from 'vue'
import { useI18n } from 'vue-i18n'
import { useRouter } from 'vue-router'
import { useParkedAmount } from '@/composables/useParkedAmount'
import { useQrScanner } from '@/composables/useQrScanner'
import CONFIG from '@/config'
import { backOrOverview } from '@/utils/backOrOverview'
import { openExternalUrl } from '@/utils/browserLocation'
import { communityHost } from '@/utils/gradidoAddress'
import { countScannerOpen } from '@/utils/scannerOpens'
import { resolveScanTarget } from '@/utils/scanTarget'
import IMdiArrowLeft from '~icons/mdi/arrow-left'
import IMdiCellphone from '~icons/mdi/cellphone'
import IMdiKeyboardOutline from '~icons/mdi/keyboard-outline'
import IMdiWeb from '~icons/mdi/web'
import classes from './Scanner.module.scss'

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

/** What the parser makes of a payload (utils/scanTarget); `url` and `host` on a foreign one. */
interface ScanTarget {
  kind: string
  path: string
  foreign: boolean
  url?: string
  host?: string
}

/** The target on the confirmation card, with the raw text it was read from. */
type ShownTarget = ScanTarget & { raw: string }

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
export const Scanner = defineComponent({
  name: 'Scanner',
  setup() {
    const { t } = useI18n()
    const router = useRouter()
    const { readParked } = useParkedAmount()

    const videoElement = ref<HTMLVideoElement | null>(null)
    const foreignTarget = ref<ShownTarget | null>(null)
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

    /**
     * Whether this is at least the second scanner start in this session. Engines that tie the
     * camera grant to a live capture session (iOS Safari) ask the permission question again
     * with every start — and the wallet stops the camera on every way out on purpose, so it
     * cannot dodge the question by keeping the camera running (the light would stay on). What
     * it CAN do is tell people, exactly at the second question, that the browser's own site
     * settings allow the camera for this page for good. (Bernd, 21.08.2026)
     */
    const repeatedOpen = countScannerOpen() > 1

    let ignoredValue: string | null = null
    let ignoredAt = 0
    let unknownTimer: number | undefined

    const ignoreForNow = (rawValue: string) => {
      ignoredValue = rawValue
      ignoredAt = Date.now()
    }

    const isIgnored = (rawValue: string) =>
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
    const handleTarget = (target: ScanTarget, raw: string) => {
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
    const onCode = (rawValue: string) => {
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
      // Only the card's own button calls this, so there is a target.
      const { url } = foreignTarget.value as ShownTarget
      // The camera dies BEFORE the jump: window.location does not unmount this page, so
      // onUnmounted would never run and the light would stay on until the browser unloads.
      scanner.stop()
      openExternalUrl(url)
    }

    const continueScanning = () => {
      // The dismissed code stays quiet for a moment — otherwise the card still in the
      // picture would raise the sheet again on the very next tick.
      ignoreForNow((foreignTarget.value as ShownTarget).raw)
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
     * the wallet -- as does a step back that would lead to the sign-in form
     * (utils/backOrOverview).
     */
    const goBack = () => {
      scanner.stop()
      backOrOverview(router)
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

    // No props of BFormInput: they land on the input as the attributes the template wrote.
    const codeKeyboard = {
      autocapitalize: 'none',
      autocorrect: 'off',
      spellcheck: 'false',
    } as object

    return () => (
      <div class={['scanner', classes.scanner]} data-test='scanner'>
        {/* The head is the page's own chrome, like the calculator's: the route is bareChrome
            on a phone, so there this arrow is the only way out. 44px target, pressed
            one-handed. The arrow has a line of its own and the title stands beneath it,
            centred over the viewfinder -- the same head as the member's own codes
            (OwnCodeView). From lg on the wallet's chrome is back and the layout prints the
            title as the page heading, so this head goes (style module). */}
        <div class='scanner-head'>
          <button
            type='button'
            class='scanner-head-key'
            aria-label={t('scanner.back')}
            data-test='scanner-back'
            onClick={goBack}
          >
            <IMdiArrowLeft />
          </button>
          <div class='scanner-title fs-5' data-test='scanner-title'>
            {t('scanner.title')}
          </div>
        </div>

        {/* ── The viewfinder ─────────────────────────────────────────────────────────── */}
        {/* Also rendered while idle (camera stopped for a hidden tab or an open foreign
            card): the video element has to survive those moments, or there would be nothing
            to restart the camera into. */}
        {!fallbackView.value ? (
          <>
            <div class='scanner-frame'>
              {/* playsinline keeps iOS from going fullscreen; muted is what allows play()
                  without a gesture on every platform this runs on. */}
              <video ref={videoElement} class='scanner-video' autoplay muted playsinline />
              <span class='scanner-corner scanner-corner-tl' aria-hidden='true' />
              <span class='scanner-corner scanner-corner-tr' aria-hidden='true' />
              <span class='scanner-corner scanner-corner-bl' aria-hidden='true' />
              <span class='scanner-corner scanner-corner-br' aria-hidden='true' />
            </div>

            <div class='scanner-hint' data-test='scanner-hint'>
              {t('scanner.hint')}
            </div>

            {/* Visible WHILE the camera runs, deliberately: the moment somebody realises the
                code will not read (glare, a worn card) must not force them back out. */}
            <button
              type='button'
              class='scanner-manual-link'
              data-test='scanner-manual-open'
              onClick={openManual}
            >
              {t('scanner.manual.open')}
            </button>

            {/* From the second start in this browser session on: the permission question has
                just come back, and this is the moment somebody wants to know how to make it
                stop. See repeatedOpen. */}
            {repeatedOpen ? (
              <div class='scanner-permission-hint' data-test='scanner-permission-hint'>
                {t('scanner.permission-hint')}
              </div>
            ) : null}

            {/* "No Gradido code": an answer, not an alarm. It shows briefly and scanning just
                continues; the same unknown code re-announces itself only after the lock below
                runs out, so a code held into the picture does not flicker this at 10/s. */}
            {unknownShown.value ? (
              <div class='scanner-unknown' data-test='scanner-unknown'>
                {t('scanner.no-gradido-code')}
              </div>
            ) : null}
          </>
        ) : (
          /* ── Camera refused or missing ──────────────────────────────────────────────── */
          /* No reproach: one sentence about the remedy, then the two old ways as cards.
             Both ways keep working forever — the scanner is an addition, not a toll gate. */
          <div class='scanner-denied' data-test='scanner-denied'>
            <div class='scanner-denied-title'>
              {state.value === 'denied'
                ? t('scanner.denied.title')
                : t('scanner.unavailable.title')}
            </div>
            {state.value === 'denied' ? (
              <div class='scanner-denied-help'>{t('scanner.denied.help')}</div>
            ) : null}

            <div class='scanner-way-card'>
              <div class='scanner-way-title'>
                <IMdiCellphone class='scanner-way-icon' /> {t('scanner.system-camera.title')}
              </div>
              <div class='scanner-way-text'>{t('scanner.system-camera.text')}</div>
              {/* Only when an amount actually waits: said unconditionally, this sentence
                  would promise a prefilled field to somebody who never parked anything. */}
              {parkedWaiting ? (
                <div class='scanner-way-parked' data-test='scanner-parked-waiting'>
                  {t('scanner.system-camera.parked')}
                </div>
              ) : null}
            </div>

            <div class='scanner-way-card'>
              <div class='scanner-way-title'>
                <IMdiKeyboardOutline class='scanner-way-icon' /> {t('scanner.manual.open')}
              </div>
              <form class='scanner-manual-form' onSubmit={withModifiers(submitManual, ['prevent'])}>
                <label class='visually-hidden' for='scanner-manual-inline'>
                  {t('scanner.manual.label')}
                </label>
                {/* Codes are case-sensitive and no words: the device keyboard must neither
                    capitalize nor "correct" them, or the person types exactly what the card
                    says and still lands on "link invalid". */}
                <BFormInput
                  id='scanner-manual-inline'
                  modelValue={manualText.value}
                  type='text'
                  {...codeKeyboard}
                  inputmode='url'
                  placeholder={t('scanner.manual.label')}
                  data-test='scanner-manual-input'
                  onUpdate:modelValue={(value) => {
                    manualText.value = value as string
                  }}
                />
                <BButton
                  type='submit'
                  variant={'gradido' as ButtonVariant}
                  data-test='scanner-manual-submit'
                >
                  {t('scanner.manual.submit')}
                </BButton>
              </form>
              {manualInvalid.value ? (
                <div class='scanner-manual-invalid' data-test='scanner-manual-invalid'>
                  {t('scanner.manual.invalid')}
                </div>
              ) : null}
            </div>
          </div>
        )}

        {/* ── Foreign community: the slid-up confirmation card ───────────────────────── */}
        {/*
          ⛔ Why this card exists at all — and why it is the ONLY way a foreign link opens:

          Reading codes of OTHER communities is the point of the network (federation): the
          classic case is the thank-you card of another community at the counter. The card is
          NOT distrust of communities — it is distrust of stickers. A code pasted over a real
          one looks identical through a viewfinder, and the jump it triggers leaves this
          wallet along with its login. So the person sees the HOST they are about to visit,
          confirms with one press, and only that press navigates. The own origin, by
          contrast, passes wordlessly — nothing is left to confirm when nothing is left.
        */}
        {foreignTarget.value ? (
          <div class='scanner-sheet' data-test='scanner-foreign'>
            <div class='scanner-sheet-title'>
              <IMdiWeb class='scanner-sheet-icon' />{' '}
              {/* eslint-disable-next-line @intlify/vue-i18n/no-dynamic-keys */}
              {t(`scanner.foreign.${foreignTarget.value.kind}`)}
            </div>
            <div class='scanner-sheet-host' data-test='scanner-foreign-host'>
              {foreignTarget.value.host}
            </div>
            <BButton
              variant={'gradido' as ButtonVariant}
              class='w-100'
              data-test='scanner-foreign-open'
              onClick={openForeign}
            >
              {t('scanner.foreign.open')}
            </BButton>
            <button
              type='button'
              class='scanner-sheet-dismiss'
              data-test='scanner-foreign-continue'
              onClick={continueScanning}
            >
              {t('scanner.foreign.continue')}
            </button>
          </div>
        ) : null}

        {/* ── Hand entry over the running viewfinder ─────────────────────────────────── */}
        {/* Gone in the fallback view, where the same form sits inline — two rendered forms
            would answer the same data-test twice. */}
        {manualOpen.value && !fallbackView.value ? (
          <div class='scanner-sheet' data-test='scanner-manual'>
            <form class='scanner-manual-form' onSubmit={withModifiers(submitManual, ['prevent'])}>
              <label class='scanner-sheet-label' for='scanner-manual-sheet'>
                {t('scanner.manual.label')}
              </label>
              {/* Same keyboard discipline as the inline twin: codes are case-sensitive. */}
              <BFormInput
                id='scanner-manual-sheet'
                modelValue={manualText.value}
                type='text'
                {...codeKeyboard}
                inputmode='url'
                data-test='scanner-manual-input'
                onUpdate:modelValue={(value) => {
                  manualText.value = value as string
                }}
              />
              <BButton
                type='submit'
                variant={'gradido' as ButtonVariant}
                class='w-100'
                data-test='scanner-manual-submit'
              >
                {t('scanner.manual.submit')}
              </BButton>
            </form>
            {manualInvalid.value ? (
              <div class='scanner-manual-invalid' data-test='scanner-manual-invalid'>
                {t('scanner.manual.invalid')}
              </div>
            ) : null}
            <button
              type='button'
              class='scanner-sheet-dismiss'
              data-test='scanner-manual-close'
              onClick={closeManual}
            >
              {t('scanner.manual.close')}
            </button>
          </div>
        ) : null}
      </div>
    )
  },
})
