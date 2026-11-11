// AI-GENERATED — not an architecture reference
import { config } from '@vue/test-utils'

/**
 * The tests leave unplugin-vue-components out (see vitest.config.js), so every icon, every
 * BootstrapVueNext tag and every `<i18n-t>` a .vue template uses unstubbed is rendered as an
 * unresolved element -- some specs even find them by that tag. Vue reports each of them,
 * about 36,000 lines per run, which buries every other warning. Only that one report is
 * dropped here; everything else Vue has to say is printed as before.
 */
const SILENCED = 'Failed to resolve component'

config.global.config.warnHandler = (msg, _instance, trace) => {
  if (msg.startsWith(SILENCED)) {
    return
  }
  // The handler stands in for Vue's own console.warn, so it has to call it itself.
  // eslint-disable-next-line no-console
  console.warn(trace ? `[Vue warn]: ${msg}\n${trace}` : `[Vue warn]: ${msg}`)
}
