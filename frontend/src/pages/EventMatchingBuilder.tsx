// AI-GENERATED — not an architecture reference
import { BButton, BContainer, BFormCheckbox } from 'bootstrap-vue-next'
import { computed, defineComponent, onBeforeUnmount, ref, shallowRef, watch } from 'vue'
import { useI18n } from 'vue-i18n'
import { useAppToast } from '@/composables/useToast'
import CONFIG from '@/config'
import { qrCodeOptions, renderQrCodeCanvas } from '@/utils/qrCode'
import classes from './EventMatchingBuilder.module.scss'

// The sentence becomes the `summary` of a matching entry, which holds 160 characters.
const SENTENCE_MAX = 160
// An entry's details may be far longer. 300 is what matching reads of them when it works out
// what an entry is about (KEYING_DETAILS_MAX_CHARS in the backend), so more would lengthen
// the link and change nothing.
const DETAILS_MAX = 300
// The version of the link's form. A later one may add parameters, never give one a new meaning.
const LINK_VERSION = '1'
const CODE_FILE_NAME = 'gradido-project-matching.png'
// What a QR code holds at the error level the coin in its middle needs (`qrCodeOptions`,
// level H): 1273 bytes in its largest form, and the link is plain ASCII once it is encoded.
// A letter outside ASCII takes six characters or more there, so a long text in Cyrillic or
// Greek gets past it.
const CODE_MAX_LENGTH = 1273
// The white margin a scanner needs around a code, in modules. The generator draws none, and
// the picture is meant for slides and newsletters, whose ground is not always white.
const CODE_QUIET_ZONE = 4
// How long the host has to pause before the code is drawn, in ms. Drawing is work: measured in
// the built wallet with the processor slowed to a quarter, as on a phone, one drawing held the
// page for more than 100 ms -- and at every key that made typing stutter. Longer than the gap
// between two keys of somebody who types slowly, or the pause would end at every one of them.
const CODE_PAUSE = 600

/** The last code that was drawn, with the link it belongs to. */
type Drawn = { link: string; picture: string; failed: boolean }
const NOTHING_DRAWN: Drawn = Object.freeze({ link: '', picture: '', failed: false })

/**
 * At most `max` UTF-16 units, the measure of the fields' `maxlength`, and never half a
 * surrogate pair: an emoji cut in two would travel as "�". (The server counts such a pair as
 * one character, so it allows a little more than this, never less.)
 *
 * The fields carry `maxlength`, which is what a person meets. This is what the link is built
 * from, so that it keeps the limits however the text got into the field.
 */
const clip = (text: string, max: number) => {
  if (text.length <= max) {
    return text
  }
  const cut = text.slice(0, max)
  const last = cut.charCodeAt(cut.length - 1)
  return last >= 0xd800 && last <= 0xdbff ? cut.slice(0, -1) : cut
}

/**
 * The code on white, with the margin around it that the generator leaves out.
 *
 * One picture for the screen and for the file, so what the host sees is what they save -- and
 * the same generator and settings as every other code of the wallet (`utils/qrCode`).
 */
const onWhite = (code: HTMLCanvasElement) => {
  // The settings are asked for their cell size only; no coin is drawn here.
  const margin = CODE_QUIET_ZONE * qrCodeOptions('', null as unknown as HTMLImageElement).cellSize
  const sheet = document.createElement('canvas')
  sheet.width = code.width + 2 * margin
  sheet.height = code.height + 2 * margin
  const paper = sheet.getContext('2d') as CanvasRenderingContext2D
  paper.fillStyle = '#fff'
  paper.fillRect(0, 0, sheet.width, sheet.height)
  paper.drawImage(code, margin, margin)
  return sheet.toDataURL('image/png')
}

/**
 * Project matching (in the code: event matching, its first name), the host's side: three fields,
 * and out of them the link that puts a project into the accounts of its people as their first
 * entry on the map -- with its QR code and a paragraph for the invitation.
 *
 * The page is public (a host needs no account) and stateless: what is typed here goes into
 * the link and nowhere else -- no request carries it, no store and no storage keeps it. The
 * link is the whole result. It is made for the entrance at `/project`, a page of its own that
 * reads it from the address and is built beside this one. What the two agree on is written
 * down outside the code, as a contract, because a link that has gone out in a mail or onto a
 * slide has to keep working: the path, the four parameters `interest`, `details`, `remote`
 * and `v`, and the limits above. ⛔ Never rename a parameter, and never add a fifth without
 * the entrance reading it. A path gets a new name only beside the old one: the first links
 * went out with `/event`, and that address stays (routes.js).
 */
export const EventMatchingBuilder = defineComponent({
  name: 'EventMatchingBuilder',
  setup() {
    const { t, locale } = useI18n()
    const { toastSuccess, toastError } = useAppToast()

    // "Projekt " -- a suggestion, not a rule. With the word in front the sentence also reads
    // for a title like "Deutschland am Abgrund"; whoever writes "Verein ..." instead gets that.
    const suggestion = () => `${t('eventMatching.builder.sentenceDefault')} `
    // What the field was given, kept apart from what stands in it: the result below appears
    // once the host has written something of their own, and that is measured against this.
    const suggested = ref(suggestion())
    const sentence = ref(suggested.value)
    const details = ref('')
    const remote = ref(true)

    // The suggestion follows the language for as long as nobody has written in the field. Once
    // somebody has, both stay: the field as it is, and `suggested` as the word that was given
    // -- the bare word of the language before is nobody's project in the new language either.
    watch(locale, () => {
      if (sentence.value !== suggested.value) {
        return
      }
      suggested.value = suggestion()
      sentence.value = suggested.value
    })

    const typedSentence = computed(() => clip(sentence.value, SENTENCE_MAX))
    const typedDetails = computed(() => clip(details.value, DETAILS_MAX))
    const interest = computed(() => typedSentence.value.trim())
    const explanation = computed(() => typedDetails.value.trim())
    // Whether the host has written a name of their own: more than the suggested word.
    const named = computed(() => interest.value !== '' && interest.value !== suggested.value.trim())
    // And details. The form a guest's link opens saves an entry only with details, so a link
    // without them would open it with "Save" greyed out (Bernd, 13.10.2026: the builder asks
    // for them).
    const ready = computed(() => named.value && explanation.value !== '')

    // The whole sentence as a guest will read it in their entry, in the reader's language.
    const wholeSentence = computed(() => {
      const start = t('matching.type.interesse.prefix')
      return interest.value
        ? `${start} ${interest.value}`
        : t('matching.new.sentenceStart', { start })
    })

    // Built on this community's own address: the link leads to the wallet it was made in. The
    // configuration always names it; the address in the address bar stands in where it does
    // not.
    const link = computed(() => {
      if (!ready.value) {
        return ''
      }
      const address = new URL('/project', CONFIG.COMMUNITY_URL || window.location.origin)
      address.searchParams.set('interest', interest.value)
      address.searchParams.set('details', explanation.value)
      address.searchParams.set('remote', remote.value ? '1' : '0')
      address.searchParams.set('v', LINK_VERSION)
      return address.toString()
    })

    // The paragraph for the invitation, with the link on a line of its own at the end.
    const mail = computed(() =>
      link.value ? `${t('eventMatching.builder.mailText')}\n${link.value}` : '',
    )

    const drawn = shallowRef<Drawn>(NOTHING_DRAWN)
    const codeTooLong = computed(() => link.value.length > CODE_MAX_LENGTH)
    // Said until a code is drawn again, also while the host types on: it is about the code,
    // not about one link, and taken away for the length of every pause it would only blink.
    const codeFailed = computed(() => drawn.value.failed)
    // Whether the picture in the box is the code of the link above it. While the host types
    // it is the one from before, and it is shown faded for as long.
    const codeCurrent = computed(
      () => drawn.value.picture !== '' && drawn.value.link === link.value,
    )

    // The drawing that was started last. One link can be drawn twice -- typed, changed and
    // typed again, or the button pressed while a drawing is out -- and the two need not end
    // alike.
    let latest: object | null = null
    const draw = async (address: string) => {
      const attempt = {}
      latest = attempt
      let result: Drawn
      try {
        result = {
          link: address,
          picture: onWhite(await renderQrCodeCanvas(address)),
          failed: false,
        }
      } catch {
        // The coin in the middle of the code comes from this wallet's own server; without it
        // there is no code. The link and the paragraph do not depend on it.
        result = { link: address, picture: '', failed: true }
      }
      // Drawing waits for the coin, and the host may go on typing meanwhile. Only the drawing
      // started last may land, and only as the code of the link as it stands NOW: never a
      // slower one from before, whether it brings a picture or a failure.
      if (attempt === latest && address === link.value) {
        drawn.value = result
      }
    }

    let pause: ReturnType<typeof setTimeout> | undefined
    let left = false
    // The pause runs from the last key, also from one that leaves the link as it was: a space
    // at the end of a word does, and the next word would begin under a drawing otherwise.
    watch([link, sentence, details], ([address]) => {
      clearTimeout(pause)
      if (!address || codeTooLong.value) {
        drawn.value = NOTHING_DRAWN
        return
      }
      // The code of this link is in the box already: nothing to draw.
      if (codeCurrent.value) {
        return
      }
      pause = setTimeout(() => draw(address), CODE_PAUSE)
    })
    onBeforeUnmount(() => {
      left = true
      clearTimeout(pause)
    })

    /**
     * Saves the code as a file -- the code of the link as it stands when the button is pressed.
     *
     * The button does not wait for the pause above: where the picture in the box is not that
     * link's yet, or could not be drawn before, it is drawn now. Handed to the browser the way
     * the wallet's other pictures are, through a link with `download`.
     */
    const saving = ref(false)
    const saveCode = async () => {
      const address = link.value
      saving.value = true
      try {
        if (!codeCurrent.value) {
          clearTimeout(pause)
          await draw(address)
        }
        // Nothing where drawing failed, nothing where the host typed on meanwhile -- the file
        // would be the code of a link that is no longer the one on the page -- and nothing
        // once the page has been left.
        if (left || drawn.value.link !== address || !drawn.value.picture) {
          return
        }
        const anchor = document.createElement('a')
        anchor.href = drawn.value.picture
        anchor.download = CODE_FILE_NAME
        anchor.click()
      } finally {
        saving.value = false
      }
    }

    // Say "copied" only once it is copied. The wallet brings a clipboard of its own where the
    // browser has none (main.js), so the call is always there -- and it is refused where
    // neither way of copying works, in some browsers built into other apps for one. Both
    // fields can be marked and copied by hand.
    const copy = async (text: string, copied: string) => {
      try {
        await navigator.clipboard.writeText(text)
        toastSuccess(copied)
      } catch {
        toastError(t('eventMatching.builder.copyFailed'))
      }
    }
    const copyLink = () => copy(link.value, t('eventMatching.builder.linkCopied'))
    const copyMail = () => copy(mail.value, t('eventMatching.builder.mailCopied'))

    const selectAll = (event: FocusEvent) =>
      (event.target as HTMLInputElement | HTMLTextAreaElement).select()

    return () => (
      <div class='event-matching-builder'>
        <BContainer>
          <h1 class='h3 mb-1' data-test='builder-title'>
            {t('eventMatching.builder.title')}
          </h1>
          <p class='mb-3'>{t('eventMatching.builder.subtitle')}</p>
          <p class='mb-2'>{t('eventMatching.builder.intro')}</p>
          <p class='small text-muted mb-4'>{t('eventMatching.builder.nothingStored')}</p>

          {/* The sentence, asked for the way the entry form asks a member for it: the words the
              guests will later find in their own form are the words the host fills in here. */}
          <label
            id='event-matching-sentence-label'
            for='event-matching-sentence'
            class='small fw-bold d-block mb-1'
          >
            {t('matching.new.completeSentence')}
          </label>
          <div
            class={[
              'builder-sentence',
              classes['builder-sentence'],
              'd-flex align-items-center gap-2',
            ]}
          >
            <span
              id='event-matching-sentence-prefix'
              class={['builder-prefix', classes['builder-prefix']]}
            >
              {t('matching.type.interesse.prefix')}
            </span>
            <input
              id='event-matching-sentence'
              v-model={sentence.value}
              type='text'
              class='form-control'
              autocomplete='off'
              maxlength={SENTENCE_MAX}
              aria-labelledby='event-matching-sentence-label event-matching-sentence-prefix'
              aria-describedby='event-matching-preview event-matching-sentence-hint'
              data-test='builder-sentence'
            />
          </div>
          <p
            id='event-matching-preview'
            class={['builder-preview', classes['builder-preview'], 'mt-2 mb-1']}
            data-test='builder-preview'
          >
            {t('eventMatching.builder.sentencePreview', { sentence: wholeSentence.value })}
          </p>
          <p id='event-matching-sentence-hint' class='small text-muted mb-4'>
            {t('eventMatching.builder.sentenceHint')}
          </p>

          <label for='event-matching-details' class='small fw-bold d-block mb-1'>
            {t('matching.entries.details')}
          </label>
          <textarea
            id='event-matching-details'
            v-model={details.value}
            class={['form-control builder-area', classes['builder-area']]}
            rows='4'
            maxlength={DETAILS_MAX}
            aria-required='true'
            aria-describedby='event-matching-details-hint event-matching-details-count'
            data-test='builder-details'
          />
          <div class='d-flex justify-content-between gap-3 mt-1 mb-4'>
            <span id='event-matching-details-hint' class='small text-muted'>
              {t('eventMatching.builder.detailsHint')}
            </span>
            <span
              id='event-matching-details-count'
              class='small text-muted text-nowrap'
              data-test='builder-details-count'
            >
              {t('eventMatching.builder.detailsCount', {
                count: typedDetails.value.length,
                max: DETAILS_MAX,
              })}
            </span>
          </div>

          <BFormCheckbox
            id='event-matching-remote'
            modelValue={remote.value}
            onUpdate:modelValue={(checked) => {
              remote.value = checked as boolean
            }}
            aria-describedby='event-matching-remote-hint'
            data-test='builder-remote'
          >
            {t('matching.new.remote')}
          </BFormCheckbox>
          <p id='event-matching-remote-hint' class='small text-muted ms-4 ps-1 mb-0'>
            {t('eventMatching.builder.remoteHint')}
          </p>

          <hr class={['builder-rule', classes['builder-rule'], 'my-4']} />

          {/* Everything below is made in this browser from the three fields above. Nothing is
              sent anywhere and nothing is kept: leaving the page forgets it. */}
          {ready.value ? (
            <div data-test='builder-result'>
              <label for='event-matching-link' class='small fw-bold d-block mb-1'>
                {t('eventMatching.builder.linkLabel')}
              </label>
              <input
                id='event-matching-link'
                type='text'
                class='form-control'
                readonly
                value={link.value}
                data-test='builder-link'
                onFocus={selectAll}
              />
              <BButton
                variant='outline-secondary'
                class='mt-2 mb-4'
                data-test='builder-copy-link'
                onClick={copyLink}
              >
                {t('eventMatching.builder.copyLink')}
              </BButton>

              <div class='small fw-bold mb-1'>{t('eventMatching.builder.codeLabel')}</div>
              {/* The box has its size before anything is drawn in it: the code arrives after
                  the link, and must not push the paragraph and its button down as it does. */}
              <div class={['builder-code', classes['builder-code']]} data-test='builder-code'>
                {codeTooLong.value ? (
                  <p
                    class={['builder-code-note', classes['builder-code-note'], 'small mb-0']}
                    data-test='builder-code-too-long'
                  >
                    {t('eventMatching.builder.codeTooLong')}
                  </p>
                ) : codeFailed.value ? (
                  <p
                    class={['builder-code-note', classes['builder-code-note'], 'small mb-0']}
                    data-test='builder-code-failed'
                  >
                    {t('eventMatching.builder.codeFailed')}
                  </p>
                ) : drawn.value.picture ? (
                  <img
                    src={drawn.value.picture}
                    alt={t('eventMatching.builder.codeAlt')}
                    class={[
                      'builder-code-picture',
                      classes['builder-code-picture'],
                      { 'is-waiting': !codeCurrent.value },
                    ]}
                    data-test='builder-code-picture'
                  />
                ) : null}
              </div>
              <BButton
                variant='outline-secondary'
                class='mt-2 mb-4'
                disabled={codeTooLong.value || saving.value}
                data-test='builder-download-code'
                onClick={saveCode}
              >
                {t('eventMatching.builder.downloadCode')}
              </BButton>

              <label for='event-matching-mail' class='small fw-bold d-block mb-1'>
                {t('eventMatching.builder.mailLabel')}
              </label>
              <textarea
                id='event-matching-mail'
                class={['form-control builder-area', classes['builder-area']]}
                rows='8'
                readonly
                value={mail.value}
                data-test='builder-mail'
                onFocus={selectAll}
              />
              <BButton
                variant='outline-secondary'
                class='mt-2'
                data-test='builder-copy-mail'
                onClick={copyMail}
              >
                {t('eventMatching.builder.copyMail')}
              </BButton>
            </div>
          ) : (
            <p class='small text-muted mb-0' data-test='builder-waiting'>
              {named.value
                ? t('eventMatching.builder.detailsMissing')
                : t('eventMatching.builder.waiting')}
            </p>
          )}
        </BContainer>
      </div>
    )
  },
})
