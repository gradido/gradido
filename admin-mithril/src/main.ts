// AI-GENERATED — not an architecture reference
import 'bootstrap/dist/css/bootstrap.css'
// the old admin's own styles, after Bootstrap's: where both set a property, the admin's wins
import '@admin/App.css'
import { dropMapWindowName } from '@admin/utils/mapWindow'
import m from 'mithril'
import { AppOutdatedBar } from '@/components/AppOutdatedBar'
import { setLocale } from '@/i18n'
import { routes } from '@/router/routes'
import { adminStore } from '@/store/admin.store'
import { followTheme } from '@/theme'

// It may be starting in the window a pin opened for the map: no pin may take this one for it.
dropMapWindowName()

setLocale(adminStore.moderator?.language ?? 'en')
// light or dark as the wallet is set on this device, and every change of it
followTheme()

const root = document.getElementById('app')
if (!root) {
  throw new Error('index.html has no #app')
}
// above every page, signed in or not, as the old admin had it
const outdatedBar = document.createElement('div')
root.before(outdatedBar)
m.mount(outdatedBar, AppOutdatedBar)
m.route.prefix = '/admin'
m.route(root, '/', routes)
