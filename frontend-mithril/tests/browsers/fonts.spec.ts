// AI-GENERATED — not an architecture reference
import { expect, test } from '@playwright/test'

// The weights a style may ask for, and the face each is drawn in: 300, 400, 600 or 700, the four
// the wallet was drawn in since it fetched Open Sans from Google. A weight the styles ask for
// between two of them (500) is not in this list: no style asks for one (see open-sans.css).
const DRAWN_IN = { 100: 300, 200: 300, 300: 300, 400: 400, 600: 600, 700: 700, 800: 700, 900: 700 }

test('fetches each file of Open Sans once, and draws every weight in one of its four faces', async ({
  page,
  browserName,
}) => {
  const fetched: string[] = []
  page.on('request', (request) => {
    if (request.url().includes('/fonts/open-sans/')) {
      fetched.push(request.url().split('/').pop() ?? '')
    }
  })
  await page.goto('login')
  const widths = await page.evaluate(async (weights) => {
    await Promise.all(weights.map((weight) => document.fonts.load(`${weight} 16px "Open Sans"`)))
    return Object.fromEntries(
      weights.map((weight) => {
        const span = document.body.appendChild(document.createElement('span'))
        Object.assign(span.style, {
          position: 'absolute',
          whiteSpace: 'nowrap',
          font: `${weight} 40px "Open Sans"`,
        })
        span.textContent = 'Gradido, das Dankbarkeitsgeld'
        const { width } = span.getBoundingClientRect()
        span.remove()
        return [weight, width]
      }),
    )
  }, Object.keys(DRAWN_IN))
  for (const [weight, face] of Object.entries(DRAWN_IN)) {
    expect(widths[weight], `weight ${weight}`).toBe(widths[face])
  }
  // four faces, each its own
  expect(new Set([300, 400, 600, 700].map((face) => widths[face])).size).toBe(4)
  // the page has drawn: whatever it needs is fetched
  await page.evaluate(() => document.fonts.ready)
  // WebKit fetches a font of its own origin without CORS, and so does not take the preload of
  // index.html, which asks for CORS as the standard says and the other two match. Where the
  // server says `no-cache` (the dev server) that file comes twice; nginx lets it be kept for
  // a week, and WebKit takes the second from there.
  const notTakenPreload = browserName === 'webkit' ? 1 : 0
  expect(fetched.length, fetched.join(', ')).toBe(new Set(fetched).size + notTakenPreload)
})
