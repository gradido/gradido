// AI-GENERATED — not an architecture reference
import { memberAvatarFull } from '@admin/graphql/memberAvatars'
import * as v from 'valibot'
import { graphqlRequest } from '@/graphql/client'
import { t } from '@/i18n'

type Zoom = {
  /** the small picture this device holds: shown at once */
  src: string
  /** whose picture it is, for a screen reader */
  label: string
  /** the full size, once it is there */
  full: string
}

/**
 * The one picture shown large, whichever circle was tapped -- a window per row would be one per
 * contribution and per message.
 */
export const memberAvatarZoom: { shown: Zoom | null } = { shown: null }

/**
 * Shows the picture of `member`, called `name`, large: the small one at once, sharpened as the
 * full size arrives. A failure says nothing: the small picture is the honest answer while the
 * large cannot be had.
 */
export const openMemberAvatarZoom = async (
  { gradidoID, communityUuid }: { gradidoID: string; communityUuid: string },
  src: string,
  name: string,
) => {
  // without a name the plain words, not "Bild von " with a hole
  const label = name ? t('avatar.zoom-picture', { name }) : t('avatar.zoom-picture-plain')
  const shown: Zoom = { src, label, full: '' }
  memberAvatarZoom.shown = shown
  const answer = await graphqlRequest(memberAvatarFull, { ref: { gradidoID, communityUuid } })
  // Into this opening's own object: closed meanwhile, or another face opened, it is shown nowhere.
  if (answer.success) {
    const full = v.parse(
      v.object({ memberAvatarFull: v.nullable(v.string()) }),
      answer.value,
    ).memberAvatarFull
    shown.full = full ? `data:image/jpeg;base64,${full}` : ''
  }
}

export const closeMemberAvatarZoom = () => {
  memberAvatarZoom.shown = null
}
