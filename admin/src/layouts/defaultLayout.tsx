// AI-GENERATED — not an architecture reference
import { defineComponent } from 'vue'
import { RouterView } from 'vue-router'
import { ContentFooter } from '@/components/ContentFooter'
import { NavBar } from '@/components/NavBar'

export const defaultLayout = defineComponent({
  name: 'defaultLayout',
  setup() {
    return () => (
      <div>
        <NavBar class='wrapper-nav' />
        <RouterView class='wrapper p-3' />
        <ContentFooter />
      </div>
    )
  },
})
