// AI-GENERATED — not an architecture reference
import { setLocale, t } from '@/i18n'

// Imported first by main.ts, for what it does: the wallet keeps the session and every device
// value in localStorage, and store/DeviceStore.ts reads it without a guard. Where the browser
// refuses it (site data blocked), say so instead of starting a wallet that cannot sign in.
try {
  localStorage.getItem('')
} catch {
  // in the browser's language: the member's own lies in the storage that is refused
  setLocale(navigator.language).then(() => {
    document.body.textContent = t('error.no-storage')
  })
  // at once, before the notice is there: nothing after this import may load
  throw new Error('localStorage cannot be read')
}
