// AI-GENERATED — not an architecture reference
import { defineComponent } from 'vue'
import IMdiAccount from '~icons/mdi/account'
import IMdiAccountGroup from '~icons/mdi/account-group'
import IMdiBellOutline from '~icons/mdi/bell-outline'
import IMdiCardAccountDetailsOutline from '~icons/mdi/card-account-details-outline'
import IMdiCreditCardOutline from '~icons/mdi/credit-card-outline'
import IMdiEyeOutline from '~icons/mdi/eye-outline'
import IMdiFlaskOutline from '~icons/mdi/flask-outline'
import IMdiPaletteOutline from '~icons/mdi/palette-outline'

export const SettingsMenuIcon = defineComponent({
  name: 'SettingsMenuIcon',
  props: {
    name: { type: String, required: true },
  },
  setup(props) {
    // ⚠️ Spelled out rather than resolved from a variable. As a .vue template this had to be:
    // the icons were auto-imported at compile time (unplugin-icons through the components
    // resolver), and `<component :is>` would have looked for a globally registered component
    // at RUNTIME and found none. They are imported now (vitest.config.js carries the icons
    // plugin for that), and one line each still keeps the list itself readable.
    return () => {
      if (props.name === 'account') {
        return <IMdiAccount />
      }
      if (props.name === 'appearance') {
        return <IMdiPaletteOutline />
      }
      if (props.name === 'gradido-card') {
        return <IMdiCardAccountDetailsOutline />
      }
      if (props.name === 'thank-you-card') {
        return <IMdiCreditCardOutline />
      }
      if (props.name === 'visibility') {
        return <IMdiEyeOutline />
      }
      if (props.name === 'notifications') {
        return <IMdiBellOutline />
      }
      if (props.name === 'communities') {
        return <IMdiAccountGroup />
      }
      if (props.name === 'function-tests') {
        return <IMdiFlaskOutline />
      }
      return null
    }
  },
})
