// AI-GENERATED — not an architecture reference
import { computed, defineComponent } from 'vue'
import { useRoute } from 'vue-router'
import { routeSection } from '@/utils/routeSection'

export const ContentHeader = defineComponent({
  name: 'ContentHeader',
  setup(_props, { slots }) {
    const route = useRoute()

    // The slot the layout fills for this section. Read through utils/routeSection, which
    // the column beside the page reads with -- the copy that stood here missed a trailing
    // slash, so `/overview/` matched no slot at all and the balance row above the page came
    // out empty. Same line, same fault, found on its twin. (27.08.2026)
    const path = computed(() => routeSection(route.path))

    return () => <div>{slots[path.value]?.()}</div>
  },
})
