// AI-GENERATED — not an architecture reference
// Imported first by main.ts, for what it does: the wallet keeps the session and every device
// value in localStorage, and store/device.ts reads it without a guard. Where the browser refuses
// it (site data blocked), say so instead of starting a wallet that cannot sign in.
try {
  localStorage.getItem('')
} catch {
  document.body.textContent = navigator.language.startsWith('de')
    ? 'Gradido braucht den Speicher des Browsers. Bitte erlaube Cookies und Websitedaten für diese Seite und lade sie neu.'
    : "Gradido needs the browser's storage. Please allow cookies and site data for this page and reload it."
  throw new Error('localStorage cannot be read')
}
