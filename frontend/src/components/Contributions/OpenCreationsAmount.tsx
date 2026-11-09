// AI-GENERATED — not an architecture reference
import { BCol, BRow } from 'bootstrap-vue-next'
import { computed, defineComponent } from 'vue'
import { useI18n } from 'vue-i18n'
import { GDD_PER_HOUR } from '@/constants'
import classes from './OpenCreationsAmount.module.scss'

const afterComma = (input: number) => parseFloat(input.toFixed(2)).toString()

/** Last month and this month: what is still open to create, in hours, and what was submitted. */
export const OpenCreationsAmount = defineComponent({
  name: 'OpenCreationsAmount',
  props: {
    minimalDate: { type: Date, required: true },
    maxGddLastMonth: { type: Number, required: true },
    maxGddThisMonth: { type: Number, required: true },
  },
  setup(props) {
    const { t, d } = useI18n()

    const hoursSubmittedThisMonth = computed(() =>
      afterComma((1000 - props.maxGddThisMonth) / GDD_PER_HOUR),
    )
    const hoursSubmittedLastMonth = computed(() =>
      afterComma((1000 - props.maxGddLastMonth) / GDD_PER_HOUR),
    )
    const hoursAvailableThisMonth = computed(() => afterComma(props.maxGddThisMonth / GDD_PER_HOUR))
    const hoursAvailableLastMonth = computed(() => afterComma(props.maxGddLastMonth / GDD_PER_HOUR))

    const gold = ['d-none d-md-inline text-center', 'text-gold', classes['text-gold']]
    const green = ['text-center', 'text-green', classes['text-green']]

    return () => (
      <div class='bg-white app-box-shadow gradido-border-radius p-3'>
        <div class='ps-3'>
          <BRow class='small'>
            <BCol>{t('time.months')}</BCol>
            <BCol class='d-none d-md-inline'>{t('status')}</BCol>
            <BCol class='d-none d-md-inline text-center'>{t('submitted')}</BCol>
            <BCol class='text-center'>{t('openHours')}</BCol>
          </BRow>

          <BRow class='fw-bold pt-3'>
            <BCol>{d(new Date(props.minimalDate), 'monthAndYear')}</BCol>
            <BCol class='d-none d-md-inline'>
              {props.maxGddLastMonth > 0 ? t('contribution.submit') : t('maxReached')}
            </BCol>
            <BCol class={gold}>
              {hoursSubmittedLastMonth.value} {t('h')}
            </BCol>
            <BCol class={green}>
              {hoursAvailableLastMonth.value} {t('h')}
            </BCol>
          </BRow>

          <BRow class='fw-bold'>
            <BCol>{d(new Date(), 'monthAndYear')}</BCol>
            <BCol class='d-none d-md-inline'>
              {props.maxGddThisMonth > 0 ? t('contribution.submit') : t('maxReached')}
            </BCol>
            <BCol class={gold}>
              {hoursSubmittedThisMonth.value} {t('h')}
            </BCol>
            <BCol class={green}>
              {hoursAvailableThisMonth.value} {t('h')}
            </BCol>
          </BRow>
        </div>
      </div>
    )
  },
})
