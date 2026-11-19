// AI-GENERATED — not an architecture reference
import { BCol, BRow } from 'bootstrap-vue-next'
import { defineComponent } from 'vue'
import { useI18n } from 'vue-i18n'
import { useFilters } from '@/composables/useFilters'
import IBiDropletHalf from '~icons/bi/droplet-half'
import classes from './DecayInformation-Decay.module.scss'

export const DecayInformationDecay = defineComponent({
  name: 'DecayInformationDecay',
  props: {
    balance: {
      type: String,
      required: true,
    },
    decay: {
      type: String,
      required: true,
    },
    previousBalance: {
      type: String,
      required: true,
    },
  },
  setup(props) {
    const { t } = useI18n()
    const { GDD } = useFilters()

    return () => (
      <div class={['decayinformation-decay', classes['decayinformation-decay']]}>
        <div class='mb-3 d-flex align-items-center'>
          <IBiDropletHalf class='me-2' />
          <b>{t('decay.calculation_decay')}</b>
        </div>
        <BRow>
          <BCol>
            <BRow>
              <BCol cols='12' lg='4' md='4'>
                <div>{t('decay.decay')}</div>
              </BCol>
              <BCol offset='1' offsetMd='0' offsetLg='0'>
                <div>
                  {GDD(props.previousBalance)} {props.decay === '0' ? t('math.minus') : ''}{' '}
                  {GDD(props.decay)} {t('math.equal')} <b>{GDD(props.balance)}</b>
                </div>
              </BCol>
            </BRow>
          </BCol>
        </BRow>
      </div>
    )
  },
})
