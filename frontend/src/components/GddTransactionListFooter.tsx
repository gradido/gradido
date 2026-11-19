// AI-GENERATED — not an architecture reference
import { BListGroup, BListGroupItem } from 'bootstrap-vue-next'
import { defineComponent } from 'vue'
import { useI18n } from 'vue-i18n'
import { RouterLink } from 'vue-router'

export const GddTransactionListFooter = defineComponent({
  name: 'GddTransactionListFooter',
  props: {
    count: { type: Number },
  },
  setup(props) {
    const { t } = useI18n()

    return () => (
      <div>
        <BListGroup>
          {props.count !== undefined && props.count > 5 ? (
            <BListGroupItem>
              <RouterLink
                to='/transactions'
                innerHTML={t('transaction.show_all', { count: props.count })}
              />
            </BListGroupItem>
          ) : null}
        </BListGroup>
      </div>
    )
  },
})
