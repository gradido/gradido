// AI-GENERATED — not an architecture reference
import { BCol, BRow } from 'bootstrap-vue-next'
import { formatDistance, type Locale } from 'date-fns'
import { de, enUS as en, es, fr, nl } from 'date-fns/locale'
import { computed, defineComponent } from 'vue'
import { useI18n } from 'vue-i18n'

const locales: Record<string, Locale> = { en, de, es, fr, nl }

export const DurationRow = defineComponent({
  name: 'DurationRow',
  props: {
    decayStart: {
      type: String,
      required: true,
    },
    decayEnd: {
      type: String,
      required: true,
    },
  },
  setup(props) {
    const { t, locale } = useI18n()

    const duration = computed(() =>
      formatDistance(new Date(props.decayEnd), new Date(props.decayStart), {
        locale: locales[locale.value],
      }),
    )

    return () => (
      <div class='duration-row'>
        <BRow>
          <BCol cols='6' lg='4' md='6' sm='6'>
            <div>{t('decay.past_time')}</div>
          </BCol>
          <BCol offset='0' class='text-end me-0'>
            {duration.value ? <span>{duration.value}</span> : null}
          </BCol>
        </BRow>
      </div>
    )
  },
})
