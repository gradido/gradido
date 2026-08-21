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
 * ⛔ The `.wasm` file is served from OUR OWN server: the `?url` import makes Vite bundle
 * it as an asset. The polyfill's default would resolve it relative to the chunk (a 404)
 * or invite a CDN override — a wallet must not fetch executable code from third parties.
 *
 * ★ Measured at build time (2026-08-21): the wasm asset is ~1.1 MB raw. It is paid once,
 * only on devices without the native API, only when the scanner opens, and the browser
 * caches it afterwards. The native path costs nothing.
 */

// A URL string, not the binary: the wasm itself stays out of every JS chunk.
import wasmUrl from 'zxing-wasm/reader/zxing_reader.wasm?url'

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

/** @returns {Promise<{ detect: (source: unknown) => Promise<Array<{ rawValue: string }>> }>} */
export const createQrDetector = async () => {
  const native = await nativeQrDetector()
  if (native) {
    return native
  }
  const { BarcodeDetector, prepareZXingModule } = await import('barcode-detector/ponyfill')
  prepareZXingModule({
    overrides: {
      locateFile: (path, prefix) => (path.endsWith('.wasm') ? wasmUrl : prefix + path),
    },
  })
  return new BarcodeDetector({ formats: ['qr_code'] })
}
