// AI-GENERATED — not an architecture reference
import { BButton, BCol, BRow, type ButtonVariant } from 'bootstrap-vue-next'
import { computed, defineComponent, type PropType, ref } from 'vue'
import { useI18n } from 'vue-i18n'
import { useFilters } from '@/composables/useFilters'
import CONFIG from '@/config'
import { thankYouMotif } from '@/utils/thankYouMotifs'
import IBiDropletHalf from '~icons/bi/droplet-half'
import type { Community } from './TransactionForm'
import type { TransactionPicture } from './TransactionPictureField'
import './TransactionConfirmationSend.css'

/** The check view of a transfer: the recipient, the amount, the message, the picture, the sum. */
export const TransactionConfirmationSend = defineComponent({
  name: 'TransactionConfirmationSend',
  props: {
    balance: { type: Number, required: true },
    identifier: { type: String, required: false, default: '' },
    amount: { type: Number, required: true },
    memo: { type: String, required: true },
    userName: { type: String, default: '' },
    /**
     * The picture that goes with the transfer, or null: `{ motif }` or `{ photo }`, as the page
     * holds it (pages/Send.tsx) -- already without a picture where none travels.
     */
    picture: { type: Object as PropType<TransactionPicture | null>, default: null },
    targetCommunity: {
      type: Object as PropType<Community>,
      default: () => ({ uuid: '', name: CONFIG.COMMUNITY_NAME }),
    },
  },
  emits: ['on-back', 'send-transaction'],
  setup(props, { emit, expose }) {
    const { t } = useI18n()
    const { GDD } = useFilters()

    const disabled = ref(false)

    /** The picture for the eye: a motif's file and name, or the photo as the member cut it. */
    const pictureShown = computed(() => {
      if (props.picture?.photo) {
        return { src: props.picture.photo.preview, name: t('thank-you-greeting.picture.own') }
      }
      return thankYouMotif(props.picture?.motif, t)
    })

    expose({ disabled })

    return () => (
      <div class='transaction-confirm-send'>
        <div class='bg-white app-box-shadow gradido-border-radius p-3'>
          <div class='h3 mb-4'>{t('form.send_check')}</div>
          <BRow class='mt-5'>
            <BCol cols='12'>
              <BRow class='mt-3'>
                <BCol class='h5'>{t('form.recipientCommunity')}</BCol>
                <BCol>{props.targetCommunity.name}</BCol>
              </BRow>
              <BRow>
                <BCol class='h5'>{t('form.recipient')}</BCol>
                <BCol>{props.userName ? props.userName : props.identifier}</BCol>
              </BRow>
              <BRow>
                <BCol class='h5'>{t('form.amount')}</BCol>
                <BCol>{GDD(props.amount)}</BCol>
              </BRow>
              <BRow>
                <BCol class='h5'>{t('form.memo')}</BCol>
                <BCol>{props.memo}</BCol>
              </BRow>
              {/* The picture that goes with the transfer, small. No row without one. */}
              {pictureShown.value ? (
                <BRow class='mt-3' data-test='confirm-send-picture'>
                  <BCol class='h5'>{t('send-picture.label')}</BCol>
                  <BCol>
                    <img
                      class='transaction-confirm-picture'
                      src={pictureShown.value.src}
                      alt={pictureShown.value.name}
                      width='360'
                      height='250'
                    />
                  </BCol>
                </BRow>
              ) : null}
            </BCol>
          </BRow>

          <BRow class='mt-5 text-color-gdd-yellow h3'>
            <BCol cols='2' class='text-end'>
              <IBiDropletHalf />
            </BCol>
            <BCol>{t('advanced-calculation')}</BCol>
          </BRow>
          {/* no prop of BRow: it lands on the row as the attribute it was */}
          <BRow class='pe-3' {...({ offset: '2' } as object)}>
            <BCol offset='2'>{t('form.current_balance')}</BCol>
            <BCol>{GDD(props.balance)}</BCol>
          </BRow>
          <BRow class='pe-3'>
            <BCol offset='2'>
              <strong>{t('form.your_amount')}</strong>
            </BCol>
            <BCol class='borderbottom'>
              <strong>{GDD(props.amount * -1)}</strong>
            </BCol>
          </BRow>
          <BRow class='pe-3'>
            <BCol offset='2'>{t('form.new_balance')}</BCol>
            <BCol>{GDD(props.balance - props.amount)}</BCol>
          </BRow>
          <BRow class='mt-5'>
            <BCol cols='12' md='6' lg='6'>
              {/* Shut once the transfer is on its way: its answer takes this step down whatever
                  stands there by then, and a transfer is not called back by walking away from it.
                  `block` is no prop of BButton: it lands on the button as the empty attribute it
                  was, here and below. */}
              <BButton
                {...({ block: '' } as object)}
                class='mb-3 mb-md-0 mb-lg-0'
                disabled={disabled.value}
                onClick={() => emit('on-back')}
              >
                {t('back')}
              </BButton>
            </BCol>
            <BCol cols='12' md='6' lg='6' class='text-lg-end'>
              <BButton
                {...({ block: '' } as object)}
                // `gradido` is the wallet's own variant (.btn-gradido, gradido.css)
                variant={'gradido' as ButtonVariant}
                disabled={disabled.value}
                onClick={() => {
                  emit('send-transaction')
                  disabled.value = true
                }}
              >
                {t('form.send_now')}
              </BButton>
            </BCol>
          </BRow>
        </div>
      </div>
    )
  },
})
