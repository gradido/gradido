// AI-GENERATED — not an architecture reference
import { onBeforeUnmount, ref } from 'vue'
import { thankYouPictureAddress } from '@/utils/thankYouPicture'

/**
 * The photo of an OPEN thank-you greeting, for the page its link opens as (ZE-019): fetched ONCE
 * from the address the server serves it under to whoever holds the code -- signed in or not --,
 * and kept in the memory of the page as an address an <img> can show.
 *
 * ⛔ Once, and kept: the sheet, the strip over the account form and "Dein Dank ist da." show the
 * same picture. After the thank-you is accepted the address serves it no more -- the large
 * rendition is deleted then --, so whatever asked again at that moment would lose the picture it
 * had a second before. And the server lets the browser keep nothing (`no-store`): an <img> that
 * named the address itself would ask anew each time it is drawn.
 *
 * Fetched, not named in an <img>: that is also what brings it over in development, where the
 * server is another port than the wallet -- the server answers every origin (CORS), while an
 * <img> across origins is turned away by its `Cross-Origin-Resource-Policy`.
 *
 * Where no picture comes -- the link is not open any more, the line -- `picture` stays null, and
 * the room of the picture stays in the colour of the card.
 *
 * @returns {{ picture: import('vue').Ref<string | null>, load: (code: string) => Promise<void> }}
 */
export const useThankYouLinkPicture = () => {
  const picture = ref(null)
  let asked = false
  let left = false

  const load = async (code) => {
    if (asked) return
    const address = thankYouPictureAddress(code)
    if (!address) return
    asked = true
    try {
      // Without cookies and without the session: the code in the address is all it takes.
      const response = await fetch(address, { cache: 'no-store', credentials: 'omit' })
      if (!response.ok) return
      const blob = await response.blob()
      // The server serves one type and nothing else; anything else is no picture of ours.
      if (left || blob.type !== 'image/jpeg') return
      picture.value = URL.createObjectURL(blob)
    } catch {
      // The line: the room stays as it is.
    }
  }

  onBeforeUnmount(() => {
    left = true
    if (picture.value) URL.revokeObjectURL(picture.value)
    picture.value = null
  })

  return { picture, load }
}
