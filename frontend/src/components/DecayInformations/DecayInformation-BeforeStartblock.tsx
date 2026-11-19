// AI-GENERATED — not an architecture reference
import { defineComponent } from 'vue'
import { useI18n } from 'vue-i18n'

export const DecayInformationBeforeStartblock = defineComponent({
  name: 'DecayInformationBeforeStartblock',
  setup() {
    const { t } = useI18n()

    return () => (
      <div class='decayinformation-startblock'>
        {/* The memo stands in the booking's row now (GddTransaction), readable without opening
            this part. */}
        <div class='mt-3 mb-3 text-center'>
          <b>{t('decay.before_startblock_transaction')}</b>
        </div>
      </div>
    )
  },
})
