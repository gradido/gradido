// AI-GENERATED — not an architecture reference
import { BCol, BRow } from 'bootstrap-vue-next'
import { defineComponent, type PropType } from 'vue'
import { useI18n } from 'vue-i18n'
import { DurationRow } from '@/components/TransactionRows/DurationRow'
import type { Decay } from '@/components/Transactions/TransactionDecay'
import { useFilters } from '@/composables/useFilters'
import IBiDropletHalf from '~icons/bi/droplet-half'

export const DecayInformationDecayStartblock = defineComponent({
  name: 'DecayInformationStartBlock',
  props: {
    balanceDate: { type: String },
    amount: {
      type: String,
    },
    decay: {
      type: Object as PropType<Decay>,
    },
    typeId: {
      type: String,
    },
  },
  setup(props) {
    const { t, d } = useI18n()
    const { GDD } = useFilters()

    return () => {
      // None of the props is required and none has a default, as before; the part is only ever
      // drawn with all of them (DecayInformation).
      const decay = props.decay as Decay
      const typeId = props.typeId as string
      return (
        <div class='decayinformation-startblock'>
          <BRow>
            <BCol cols='12'>
              <div class='text-center pb-3'>
                <IBiDropletHalf class='me-2' />
                <b>{t('decay.Starting_block_decay')}</b>
              </div>
            </BCol>
          </BRow>
          <BRow>
            <BCol offset='1' cols='11'>
              <BRow>
                <BCol cols='5'>
                  <div class='text-end'>
                    <div>{t('decay.decay_introduced')}</div>
                  </div>
                </BCol>
                <BCol cols='5'>
                  <div>{decay.start ? <span>{d(new Date(decay.start), 'long')}</span> : null}</div>
                </BCol>
              </BRow>
              <DurationRow decayStart={decay.start as string} decayEnd={decay.end as string} />

              {/* Decay */}
              <BRow>
                <BCol cols='5' class='text-end'>
                  {t('decay.decay')}
                </BCol>
                <BCol cols='7'>{GDD(decay.decay)}</BCol>
              </BRow>
            </BCol>
          </BRow>
          <hr class='mt-3 mb-3' />

          <BRow>
            <BCol class='text-center pb-3'>
              <b>{t('decay.calculation_total')}</b>
            </BCol>
          </BRow>

          {/* Type */}
          <BRow>
            <BCol offset='1' cols='11'>
              <BRow>
                <BCol cols='5' class='text-end'>
                  {/* eslint-disable-next-line @intlify/vue-i18n/no-dynamic-keys */}
                  {t(`decay.types.${typeId.toLowerCase()}`)}
                </BCol>
                <BCol cols='7'>{GDD(props.amount)}</BCol>
              </BRow>
              {/* Decay */}
              <BRow>
                <BCol cols='5' class='text-end'>
                  {t('decay.decay')}
                </BCol>
                <BCol cols='7'>{GDD(decay.decay)}</BCol>
              </BRow>
              {/* Total */}
              <BRow>
                <BCol cols='5' class='text-end'>
                  {t('decay.total')}
                </BCol>
                <BCol cols='7'>
                  <b>{GDD(Number(props.amount) + Number(decay.decay))}</b>
                </BCol>
              </BRow>
            </BCol>
          </BRow>
        </div>
      )
    }
  },
})
