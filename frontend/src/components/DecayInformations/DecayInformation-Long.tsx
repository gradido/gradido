// AI-GENERATED — not an architecture reference
import { BCol, BRow } from 'bootstrap-vue-next'
import { defineComponent, type PropType } from 'vue'
import { useI18n } from 'vue-i18n'
import { DurationRow } from '@/components/TransactionRows/DurationRow'
import type { Decay } from '@/components/Transactions/TransactionDecay'
import { useFilters } from '@/composables/useFilters'
import IBiDropletHalf from '~icons/bi/droplet-half'

export const DecayInformationLong = defineComponent({
  name: 'DecayInformationLong',
  props: {
    balance: { type: String, default: '0' },
    previousBalance: { type: String, default: '0' },
    amount: { type: String, default: '0' },
    typeId: { type: String, default: '' },
    decay: {
      type: Object as PropType<Decay>,
    },
  },
  setup(props) {
    const { t, d } = useI18n()
    const { GDD } = useFilters()

    return () => {
      // Not required and without a default, as before; the part is only ever drawn with a
      // decay that has a start (DecayInformation).
      const decay = props.decay as Decay
      return (
        <div class='decayinformation-long px-1'>
          <div class='mb-3'>
            <IBiDropletHalf class='me-2' />
            <b>{t('decay.calculation_decay')}</b>
          </div>
          <BRow>
            <BCol>
              <BRow>
                <BCol cols='6' lg='4' md='6' sm='6'>
                  <div>{t('decay.last_transaction')}</div>
                </BCol>
                <BCol offset='0' class='text-end me-0'>
                  <div>
                    <span>{d(new Date(decay.start as string), 'long')}</span>
                  </div>
                </BCol>
              </BRow>
              <DurationRow decayStart={decay.start as string} decayEnd={decay.end as string} />

              {/* Previous Balance */}
              <BRow class='mt-2'>
                <BCol cols='6' lg='4' md='6' sm='6'>
                  <div>{t('decay.old_balance')}</div>
                </BCol>
                <BCol offset='0' class='text-end me-0'>
                  {GDD(props.previousBalance)}
                </BCol>
              </BRow>

              {/* Decay */}
              <BRow class='mt-0'>
                <BCol cols='6' lg='3' md='6' sm='6'>
                  <div>{t('decay.decay')}</div>
                </BCol>
                <BCol offset='0' class='text-end me-0'>
                  {GDD(decay.decay)}
                </BCol>
              </BRow>
            </BCol>
          </BRow>
          {/* Type */}
          <BRow>
            <BCol>
              <BRow class='mb-2'>
                <BCol cols='6' lg='3' md='6' sm='6'>
                  {/* eslint-disable-next-line @intlify/vue-i18n/no-dynamic-keys */}
                  {t(`decay.types.${props.typeId.toLowerCase()}`)}
                </BCol>
                <BCol offset='0' class='text-end me-0'>
                  {GDD(props.amount)}
                </BCol>
              </BRow>
              {/* Total */}
              <BRow class='border-top pt-2'>
                <BCol cols='6' lg='3' md='6' sm='6'>
                  <div>{t('decay.new_balance')}</div>
                </BCol>
                <BCol offset='0' class='text-end me-0'>
                  <b>{GDD(props.balance)}</b>
                </BCol>
              </BRow>
            </BCol>
          </BRow>
        </div>
      )
    }
  },
})
