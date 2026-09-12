// AI-GENERATED — not an architecture reference
import { computed, ref } from 'vue'

/**
 * Which member's picture is open at full size, for the one window that shows it.
 *
 * ⛔ ONE window for the whole interface, opened from wherever a circle is tapped -- a modal
 * per row would build one per contribution and per message. The state lives here rather than
 * in the window so that any avatar can open it without knowing where it hangs.
 *
 * ⚠️ Deliberately plainer than the wallet's zoom: no growing out of the circle, no
 * animation, no focus choreography (Bernd, 12.09.2026 -- a moderation tool wants the picture,
 * not the flourish). What it keeps is the part that matters: the small rendition is shown at
 * once and the full size replaces it when it arrives, so a tap is never answered by an empty
 * box.
 */
const state = ref(null)

export const memberAvatarZoomState = computed(() => state.value)

/**
 * @param {{member: {gradidoID: string, communityUuid?: string|null}, src: string, label?: string}} options
 */
export const openMemberAvatarZoom = ({ member, src, label = '' }) => {
  // Both halves are required and neither is a formality: without `src` there is no picture
  // on this device, so there is nothing to open -- the circle shows letters, and enlarging
  // letters is not a thing anybody asked for.
  if (!member?.gradidoID || !src) return
  state.value = {
    member: { gradidoID: member.gradidoID, communityUuid: member.communityUuid ?? null },
    src,
    label,
  }
}

export const closeMemberAvatarZoom = () => {
  state.value = null
}
