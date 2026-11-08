// AI-GENERATED — not an architecture reference
import { computed, defineComponent, onBeforeUnmount, onMounted, ref, Transition } from 'vue'
import { useI18n } from 'vue-i18n'
import classes from './AuthTriads.module.scss'

/** How long one triad stays before the next one slides in. */
const TRIAD_INTERVAL_MS = 7000
/** Two full rounds, then the slogan stays where it is. */
const ROUNDS = 2

type Triad = { name: string; parts: string[] }

export const AuthTriads = defineComponent({
  name: 'AuthTriads',
  setup() {
    const { t } = useI18n()

    const triads = computed<Triad[]>(() => [
      {
        name: 'slogan',
        parts: [
          t('auth.triads.slogan.help'),
          t('auth.triads.slogan.give'),
          t('auth.triads.slogan.thank'),
        ],
      },
      {
        name: 'design',
        parts: [
          t('auth.triads.design.communityBased'),
          t('auth.triads.design.decentralized'),
          t('auth.triads.design.openSource'),
        ],
      },
      {
        name: 'purpose',
        parts: [
          t('auth.triads.purpose.youAndMe'),
          t('auth.triads.purpose.community'),
          t('auth.triads.purpose.nature'),
        ],
      },
    ])

    const spokenText = computed(() => triads.value.flatMap((triad) => triad.parts).join(' '))

    const current = ref(0)
    const shown = computed(() => triads.value[current.value])

    let steps = 0
    let timer: ReturnType<typeof setInterval> | undefined

    function stop() {
      clearInterval(timer)
      timer = undefined
      document.removeEventListener('focusin', stopWhenTyping)
    }

    function advance() {
      // A tab in the background does not use up the rounds: they are there to be seen.
      if (document.hidden) {
        return
      }
      current.value = (current.value + 1) % triads.value.length
      steps += 1
      // After two rounds the index is back at 0, the slogan.
      if (steps === ROUNDS * triads.value.length) {
        stop()
      }
    }

    function stopWhenTyping(event: Event) {
      // Once somebody is in a form field, nothing moves next to what they are typing.
      if (event.target instanceof Element && event.target.closest('input, textarea, select')) {
        stop()
      }
    }

    onMounted(() => {
      timer = setInterval(advance, TRIAD_INTERVAL_MS)
      document.addEventListener('focusin', stopWhenTyping)
    })

    onBeforeUnmount(stop)

    return () => (
      <div class={['auth-triads text-center', classes.authTriads]}>
        {/* Screen readers get the three triads once, not again with every change. */}
        <span class='visually-hidden' data-test='triads-spoken'>
          {spokenText.value}
        </span>
        <div class={['triad-stage', classes.triadStage]} aria-hidden='true' data-test='triad-stage'>
          {/* Every triad is laid out here once more, invisibly, in the same grid cell as the
              visible one. The cell therefore takes the height of the tallest triad in the
              current language, width and text size, and the form below does not move when one
              triad replaces another. */}
          {triads.value.map((triad) => (
            <div
              key={`sizer-${triad.name}`}
              class={['triad triad-sizer', classes.triad, classes.triadSizer]}
              data-test='triad-sizer'
            >
              {triad.parts.map((part) => (
                <span key={part} class='triad-part'>
                  {part}
                </span>
              ))}
            </div>
          ))}
          <Transition name='triad-slide'>
            <div
              key={shown.value.name}
              class={['triad', classes.triad]}
              data-test={`triad-${shown.value.name}`}
            >
              {shown.value.parts.map((part) => (
                <span key={part} class='triad-part'>
                  {part}
                </span>
              ))}
            </div>
          </Transition>
        </div>
      </div>
    )
  },
})
