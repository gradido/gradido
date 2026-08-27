// AI-GENERATED — not an architecture reference

/**
 * Hands out a QR detector, built against the standard `BarcodeDetector` API.
 *
 * ## Native where it exists, polyfill only where it does not
 *
 * Practically every Android/Chromium browser brings `BarcodeDetector` natively — zero
 * bytes to load and the fastest path. iOS Safari and Firefox do not; there a WASM
 * polyfill (zxing-wasm) is loaded LAZILY, the moment the scanner opens, never in the
 * main bundle. Both ends answer the same `detect()` contract, so the caller never
 * learns which one it got.
 *
 * `forcePonyfill` exists for the caller's escape hatch: a native detector can pass the
 * format probe and still throw on every `detect()` (Chromium without Google's detection
 * service) — the scan loop demotes to the ponyfill when it sees that.
 *
 * ⛔ The `.wasm` file is served from OUR OWN server: the `?url` import makes Vite bundle
 * it as an asset. The polyfill's default would resolve it relative to the chunk (a 404)
 * or invite a CDN override — a wallet must not fetch executable code from third parties.
 * zxing-wasm is declared in package.json at the exact version barcode-detector pins,
 * because the ponyfill INLINES its glue at build time: a second zxing-wasm version in
 * the tree would silently pair a mismatched binary with that frozen glue.
 *
 * ★ Measured at build time (2026-08-21): the wasm asset is ~1.1 MB raw. It is paid once,
 * only on devices without the native API, only when the scanner opens, and the browser
 * caches it afterwards. The native path costs nothing.
 */

// A URL string, not the binary: the wasm itself stays out of every JS chunk.
import wasmUrl from 'zxing-wasm/reader/zxing_reader.wasm?url'

/**
 * ⛔ ONE overrides object for the module's lifetime, not a fresh one per call:
 * zxing-wasm keys its compiled-module cache on the overrides' per-property identity,
 * and a new `locateFile` closure per call would purge that cache — a full ~1.1 MB
 * recompile on every scanner reopen, on exactly the devices that need the polyfill.
 */
const ZXING_PREPARE_OPTIONS = {
  overrides: {
    locateFile: (path, prefix) => (path.endsWith('.wasm') ? wasmUrl : prefix + path),
  },
}

/** The loaded-and-configured ponyfill module — resolved once, then reused. */
let ponyfillClassPromise = null

const ponyfillDetector = () => {
  if (!ponyfillClassPromise) {
    ponyfillClassPromise = import('barcode-detector/ponyfill').then(
      ({ BarcodeDetector, prepareZXingModule }) => {
        prepareZXingModule(ZXING_PREPARE_OPTIONS)
        return BarcodeDetector
      },
    )
  }
  return ponyfillClassPromise.then(
    (PonyfillDetector) => new PonyfillDetector({ formats: ['qr_code'] }),
  )
}

/**
 * True when the browser's own detector exists and can read QR codes.
 *
 * `getSupportedFormats` is asked rather than assumed: the API exists on some platforms
 * with an empty format list, and such a detector would sit there finding nothing.
 */
const nativeQrDetector = async () => {
  const Native = window.BarcodeDetector
  if (!Native) {
    return null
  }
  try {
    const formats = await Native.getSupportedFormats()
    return formats.includes('qr_code') ? new Native({ formats: ['qr_code'] }) : null
  } catch {
    return null
  }
}

/**
 * @param {{ forcePonyfill?: boolean }} [options]
 * @returns {Promise<{ detect: (source: unknown) => Promise<Array<{ rawValue: string }>> }>}
 */
export const createQrDetector = async ({ forcePonyfill = false } = {}) => {
  if (!forcePonyfill) {
    const native = await nativeQrDetector()
    if (native) {
      return native
    }
  }
  return ponyfillDetector()
}
