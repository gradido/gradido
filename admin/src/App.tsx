// AI-GENERATED — not an architecture reference
import { BModalOrchestrator, BToastOrchestrator } from 'bootstrap-vue-next'
import { defineComponent } from 'vue'
import { RouterView } from 'vue-router'
import { AppOutdatedBar } from '@/components/AppOutdatedBar'
import { MemberAvatarZoom } from '@/components/MemberAvatarZoom'
import { useTheme } from '@/composables/useTheme'
import { defaultLayout as DefaultLayout } from '@/layouts/defaultLayout'
import { useAdminStore } from '@/store/useAdminStore'
import './App.css'

export const App = defineComponent({
  name: 'App',
  setup() {
    const store = useAdminStore()
    // Light or dark as the wallet is set on this device, and every change of it (AO-011).
    useTheme()

    return () => (
      <div id='app'>
        <BToastOrchestrator />
        <AppOutdatedBar />
        {store.token ? <DefaultLayout /> : <RouterView />}
        {/* ONE window for every face in this interface (a modal per row would build one per
            contribution and per message). Only while signed in: it asks the server for the
            full-size picture, and there is nobody to ask for before the moderator is. */}
        {store.token ? <MemberAvatarZoom /> : null}
        <BModalOrchestrator />
      </div>
    )
  },
})
