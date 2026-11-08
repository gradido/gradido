// AI-GENERATED — not an architecture reference
import { BButton, BCol, BRow, type ButtonVariant } from 'bootstrap-vue-next'
import { computed, defineComponent } from 'vue'
import { useI18n } from 'vue-i18n'
import VariantIcon from '@/components/VariantIcon.vue'
import { useFilters } from '@/composables/useFilters'
import { LINK_COMPOUND_INTEREST_FACTOR } from '@/constants'
import './TransactionConfirmationLink.css'

/** The check view of a link: what it holds, what that costs, "Jetzt erzeugen". */
export const TransactionConfirmationLink = defineComponent({
  name: 'TransactionConfirmationLink',
  props: {
    balance: { type: Number, required: true },
    email: { type: String, required: false, default: '' },
    amount: { type: Number, required: true },
    memo: { type: String, required: true },
    loading: { type: Boolean, required: true },
  },
  emits: ['on-back', 'send-transaction'],
  setup(props, { emit, expose }) {
    const { t } = useI18n()
    const { GDD } = useFilters()

    const blockedAmount = computed(() => {
      // correct formula
      return props.amount * LINK_COMPOUND_INTEREST_FACTOR
      // same formula as in backend
      // return 2 * props.amount - props.amount * Math.pow(0.99999997803504048, 1209600)
    })
    const totalBalance = computed(() => props.balance - blockedAmount.value)
    const disabled = computed(() => {
      if (totalBalance.value < 0) {
        return true
      }
      return props.loading
    })

    expose({ disabled })

    return () => (
      <div class='transaction-confirm-link'>
        <div class='bg-white app-box-shadow gradido-border-radius p-3'>
          <div class='h3 mb-4'>{t('gdd_per_link.header')}</div>
          <BRow class='mt-5'>
            <BCol offset='2'>
              <div class='mt-3 h5'>{t('form.memo')}</div>
              <div>{props.memo}</div>
            </BCol>
            <BCol cols='3'>
              <div class='small'>{t('send_gdd')}</div>
              <div>{GDD(props.amount)}</div>
            </BCol>
          </BRow>

          <BRow class='mt-5 pe-3 text-color-gdd-yellow h3'>
            <BCol cols='2' class='text-end'>
              <VariantIcon icon='droplet-half' variant='gold' />
            </BCol>
            <BCol>{t('advanced-calculation')}</BCol>
          </BRow>
          {/* no prop of BRow: it lands on the row as the attribute it was */}
          <BRow class='pe-3' {...({ offset: '2' } as object)}>
            <BCol offset='2'>{t('form.current_available')}</BCol>
            <BCol>{GDD(props.balance)}</BCol>
          </BRow>
          <BRow class='pe-3'>
            <BCol offset='2'>
              <strong>{t('form.link_amount')}</strong>
            </BCol>
            <BCol>
              <strong>{GDD(props.amount * -1)}</strong>
            </BCol>
          </BRow>
          <BRow class='pe-3'>
            <BCol offset='2'>{t('decay.decay')}</BCol>
            <BCol class='borderbottom'>{GDD(props.amount - blockedAmount.value)}</BCol>
          </BRow>
          <BRow class='pe-3'>
            <BCol offset='2'>{t('form.available_after')}</BCol>
            <BCol>{GDD(props.balance - blockedAmount.value)}</BCol>
          </BRow>
          <BRow class='pe-6 mt-2'>
            <BCol offset='1'>
              <small>{t('form.link_decay_description')}</small>
            </BCol>
          </BRow>
          <BRow class='mt-5'>
            <BCol cols='12' md='6' lg='6'>
              {/* `block` is no prop of BButton: it lands on the button as the empty attribute it
                  was, here and below. */}
              <BButton
                {...({ block: '' } as object)}
                class='mb-3 mb-md-0 mb-lg-0'
                onClick={() => emit('on-back')}
              >
                {t('back')}
              </BButton>
            </BCol>
            <BCol cols='12' md='6' lg='6' class='text-lg-end'>
              <BButton
                {...({ block: '' } as object)}
                class='send-button'
                // `gradido` is the wallet's own variant (.btn-gradido, gradido.css)
                variant={'gradido' as ButtonVariant}
                disabled={disabled.value}
                onClick={() => emit('send-transaction')}
              >
                {t('form.generate_now')}
              </BButton>
            </BCol>
          </BRow>
        </div>
      </div>
    )
  },
})
