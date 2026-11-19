// AI-GENERATED — not an architecture reference
import { defineComponent } from 'vue'
import { useRoute } from 'vue-router'

export const ContributionInfo = defineComponent({
  name: 'ContributionInfo',
  setup(_props, { slots }) {
    const route = useRoute()

    return () => (
      <div class='contribution-info d-none d-lg-block'>{slots[String(route.params.tab)]?.()}</div>
    )
  },
})
