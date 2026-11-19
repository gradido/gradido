// AI-GENERATED — not an architecture reference
import { BCol, BRow } from 'bootstrap-vue-next'
import { defineComponent } from 'vue'
import { useI18n } from 'vue-i18n'
import IBiThreeDotsVertical from '~icons/bi/three-dots-vertical'

export const LastContributions = defineComponent({
  name: 'LastContributions',
  setup() {
    const { t } = useI18n()

    return () => (
      <div class='last-contributions d-none d-lg-block'>
        <BRow class='mb-5'>
          <BCol class='h3'>{t('contribution.lastContribution')}</BCol>
          <BCol cols='1' class='text-end'>
            <IBiThreeDotsVertical />
          </BCol>
        </BRow>
      </div>
    )
  },
})
