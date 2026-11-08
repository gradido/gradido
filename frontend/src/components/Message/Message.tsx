// AI-GENERATED — not an architecture reference
import { BButton, BContainer } from 'bootstrap-vue-next'
import { computed, defineComponent, type PropType } from 'vue'
import { type RouteLocationRaw, useRouter } from 'vue-router'

export const Message = defineComponent({
  name: 'Message',
  props: {
    headline: { type: String, required: true },
    subtitle: { type: String, required: true },
    buttonText: { type: String, required: false, default: null },
    // Both forms really arrive here: `ForgotPassword.vue` passes the path `/login`, every
    // other caller passes a route object. Declaring only the string made Vue warn on four
    // of six callers.
    linkTo: {
      type: [String, Object] as PropType<RouteLocationRaw>,
      required: false,
      default: null,
    },
  },
  setup(props) {
    const router = useRouter()

    const showButton = computed(() => props.buttonText && props.linkTo)

    const handleNavigation = () => {
      if (props.linkTo) {
        router.push(props.linkTo)
      }
    }

    return () => (
      <div>
        <div class='header py-lg-6'>
          {/* The whole width of the card, and the subtitle in regular weight: some subtitles run
              to four sentences (the confirmation after a guarantor-code registration), and at
              half the width in bold that one stood on twelve lines on a phone. */}
          <BContainer>
            <div class='header-body text-center mb-7'>
              <p class='h1 test-message-headline'>{props.headline}</p>
              <p class='h4 fw-normal test-message-subtitle'>{props.subtitle}</p>
              <hr />
              {showButton.value ? (
                <BButton class='test-message-button' onClick={handleNavigation}>
                  {props.buttonText}
                </BButton>
              ) : null}
            </div>
          </BContainer>
        </div>
      </div>
    )
  },
})
