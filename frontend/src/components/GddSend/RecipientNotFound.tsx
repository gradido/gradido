// AI-GENERATED — not an architecture reference
import { BButton, type ButtonVariant } from 'bootstrap-vue-next'
import { computed, defineComponent, onMounted, ref } from 'vue'
import { useI18n } from 'vue-i18n'
import { LINK_VALID_DAYS } from '@/constants'
import { focusStepHeading } from '@/utils/focusStepHeading'
import { isGradidoId } from '@/utils/gradidoAddress'
import classes from './RecipientNotFound.module.scss'

/**
 * Nobody has an account under what the member entered, in the community they chose (ZE-037). The
 * page says where it looked, shows what it looked for word for word, and opens two doors: another
 * community, or the thank-you by e-mail, which works for everybody.
 *
 * ⛔ Nothing here looks any further. Whether another community knows the address is not this
 * wallet's to ask: the form would become a directory of the whole federation by e-mail address.
 *
 * The page holds what happens behind the doors (pages/Send.tsx). While the link is made (`busy`)
 * all three are shut: the answer empties the form and leaves this step, and that must not happen
 * under the hands of somebody who has walked back into the form.
 */
export const RecipientNotFound = defineComponent({
  name: 'RecipientNotFound',
  props: {
    // What the member entered, without its community.
    identifier: { type: String, required: true },
    communityName: { type: String, required: true },
    // It has the shape of an e-mail address: only that can get a mail.
    isEmail: { type: Boolean, default: false },
    // More than one community can be reached, so there is another one to choose.
    canChooseCommunity: { type: Boolean, default: false },
    busy: { type: Boolean, default: false },
  },
  emits: ['send-by-email', 'choose-community', 'change-recipient'],
  setup(props, { emit }) {
    const { t } = useI18n()

    const title = computed(() => {
      const community = props.communityName
      if (props.isEmail) {
        return t('form.recipient-not-found.title-email', { community })
      }
      return isGradidoId(props.identifier)
        ? t('form.recipient-not-found.title-gradido-id', { community })
        : t('form.recipient-not-found.title-username', { community })
    })

    const heading = ref<HTMLHeadingElement | null>(null)
    onMounted(() => {
      if (heading.value) {
        focusStepHeading(heading.value)
      }
    })

    return () => (
      <div
        class={['recipient-not-found', classes.recipientNotFound]}
        data-test='recipient-not-found'
      >
        <div class='recipient-not-found-card bg-white app-box-shadow gradido-border-radius p-3 p-md-4'>
          {/* The step before is gone with the button that was pressed. The heading takes the
              focus, so that a screen reader says what happened, and the window shows it. */}
          <h2
            ref={heading}
            class={['h4 recipient-not-found-title', classes.recipientNotFoundTitle]}
            tabindex='-1'
            data-test='recipient-not-found-title'
          >
            {title.value}
          </h2>
          {/* Word for word and large: a typing error is found by reading it again. */}
          <p
            class={[
              'recipient-not-found-identifier text-break',
              classes.recipientNotFoundIdentifier,
            ]}
            data-test='recipient-not-found-identifier'
          >
            {props.identifier}
          </p>
          {props.canChooseCommunity ? (
            <div class={['recipient-not-found-door', classes.recipientNotFoundDoor]}>
              <p data-test='recipient-not-found-other-community'>
                {props.isEmail
                  ? t('form.recipient-not-found.other-community')
                  : t('form.recipient-not-found.other-community-entry')}
              </p>
              <BButton
                variant='outline-secondary'
                class={['recipient-not-found-button', classes.recipientNotFoundButton]}
                disabled={props.busy}
                data-test='recipient-not-found-choose-community'
                onClick={() => emit('choose-community')}
              >
                {t('form.recipient-not-found.choose-community')}
              </BButton>
            </div>
          ) : null}
          {props.isEmail ? (
            <div class={['recipient-not-found-door', classes.recipientNotFoundDoor]}>
              <p data-test='recipient-not-found-by-email'>
                {t('form.recipient-not-found.by-email', { days: LINK_VALID_DAYS }, LINK_VALID_DAYS)}
              </p>
              <BButton
                // `gradido` is the wallet's own variant (.btn-gradido, gradido.css)
                variant={'gradido' as ButtonVariant}
                class={['recipient-not-found-button', classes.recipientNotFoundButton]}
                disabled={props.busy}
                data-test='recipient-not-found-send-by-email'
                onClick={() => emit('send-by-email')}
              >
                {t('form.recipient-not-found.send-by-email')}
              </BButton>
            </div>
          ) : null}
          {/* The way back into the form, where everything entered still stands. Where it is the
              only way there is, it is a button like the others; beside a door it is a line of
              text. */}
          <div class={['recipient-not-found-back', classes.recipientNotFoundBack]}>
            <BButton
              variant={props.canChooseCommunity || props.isEmail ? 'link' : 'outline-secondary'}
              disabled={props.busy}
              data-test='recipient-not-found-change'
              onClick={() => emit('change-recipient')}
            >
              {props.isEmail
                ? t('form.recipient-not-found.change-address')
                : t('form.recipient-not-found.change-entry')}
            </BButton>
          </div>
        </div>
      </div>
    )
  },
})
