// AI-GENERATED — not an architecture reference
import { BButton, BCard, type ColorVariant } from 'bootstrap-vue-next'
import { defineComponent } from 'vue'
import { useI18n } from 'vue-i18n'

export const RedeemedTextBox = defineComponent({
  name: 'RedeemedTextBox',
  props: {
    text: { type: String, required: true },
  },
  setup(props) {
    const { t } = useI18n()

    return () => (
      <div class='redeemed-text-box'>
        <BCard bgVariant={'muted' as ColorVariant} textVariant='dark' borderVariant='info'>
          <h1>{props.text}</h1>
        </BCard>

        <div class='text-center'>
          <BButton to='/overview'>{t('back')}</BButton>
        </div>
      </div>
    )
  },
})
