// AI-GENERATED — not an architecture reference
import { useApolloClient } from '@vue/apollo-composable'
import { BModal } from 'bootstrap-vue-next'
import { type ComputedRef, defineComponent, ref, watch } from 'vue'
import { useI18n } from 'vue-i18n'
import { closeMemberAvatarZoom, memberAvatarZoomState } from '@/composables/useMemberAvatarZoom'
import { memberAvatarFull } from '@/graphql/memberAvatars'
import './MemberAvatarZoom.css'
import classes from './MemberAvatarZoom.module.css'

// The shape useMemberAvatarZoom.ts keeps; its own JSDoc names it, the JS file cannot export it.
type ZoomState = {
  member: { gradidoID: string; communityUuid: string | null }
  src: string
  label: string
}

export const MemberAvatarZoom = defineComponent({
  name: 'MemberAvatarZoom',
  setup() {
    const { t } = useI18n()
    const shown = memberAvatarZoomState as ComputedRef<ZoomState | null>
    const { client: apolloClient } = useApolloClient()

    const fullSource = ref('')

    const onVisibility = (open: boolean) => {
      if (!open) {
        closeMemberAvatarZoom()
      }
    }

    /**
     * The full-size picture of whoever is open now.
     *
     * ⚠️ The member is read from the state at the moment the ANSWER arrives as well, not only
     * when the request goes out, and BOTH halves of the pair are compared: `users` is unique on
     * (gradido_id, community_uuid), so the same gradidoID can belong to two members of different
     * communities -- and half a comparison lets one of them answer for the other, under the right
     * name.
     *
     * A failure says nothing and does nothing: the small rendition is already showing the face,
     * which is the honest answer while the big one cannot be had.
     */
    watch(
      shown,
      async (current) => {
        fullSource.value = ''
        if (!current) {
          return
        }
        const asked = current.member
        try {
          const { data } = await apolloClient.query({
            query: memberAvatarFull,
            variables: { ref: { gradidoID: asked.gradidoID, communityUuid: asked.communityUuid } },
            fetchPolicy: 'no-cache',
          })
          const still = shown.value?.member
          if (
            !still ||
            still.gradidoID !== asked.gradidoID ||
            still.communityUuid !== asked.communityUuid
          ) {
            return
          }
          if (!data?.memberAvatarFull) {
            return
          }
          fullSource.value = `data:image/jpeg;base64,${data.memberAvatarFull}`
        } catch {
          // nothing to say and nothing to do
        }
      },
      { immediate: true },
    )

    // ⛔ `noHeader` / `noFooter`, NOT `hideHeader` / `hideFooter`. bootstrap-vue-next
    // declares `noHeader`/`noFooter`; the `hide…` spelling occurs NOWHERE in the built
    // package (measured: 30 and 8 against 0 and 0). Written the other way the prop is
    // dropped in silence and the modal keeps its default footer -- which is how a picture
    // came to be opened with a Cancel and an OK button behind it (Bernd, 12.09.2026). The
    // wallet's ContactWindow carries the same note: the house has now paid for this name
    // twice.
    //
    // A picture needs neither a title bar nor buttons: it closes on a tap beside it or with
    // Escape, both of which the modal does by itself, and on a tap on the picture (below). The
    // name a header would have carried goes to `aria-label`, so a screen reader still says whose
    // face this is.
    return () => (
      <BModal
        modelValue={Boolean(shown.value)}
        aria-label={shown.value?.label || t('avatar.zoom-picture-plain')}
        centered
        noHeader
        noFooter
        contentClass='member-avatar-zoom-content'
        bodyClass='member-avatar-zoom-body'
        data-test='member-avatar-zoom'
        onUpdate:modelValue={onVisibility}
      >
        {/* ⛔ A round box of a FIXED size, and both pictures fill it. The full size used to be
            laid over the small one with `inset: 0`, which centres it on a box the size of the
            SMALL rendition -- so it spilled out over the modal's own edges, above and below,
            and the white box cut the circle (Bernd, 12.09.2026). Here nothing can overflow:
            the box is the box, and `object-fit: cover` decides what of the picture fills it.
            Same presentation as the wallet's zoom, for the same picture. */}
        {/* A tap on the picture closes it again, as a tap anywhere does in the wallet's zoom
            (AvatarZoom.vue). Only a tap beside the window's box did here, and a moderator had
            to go looking for that place (Bernd, 25.10.2026). The area spans the box's whole
            width, so the room beside the round face closes it as well. */}
        <div
          class={classes.memberAvatarZoomCloser}
          data-test='member-avatar-zoom-closer'
          onClick={closeMemberAvatarZoom}
        >
          <div class={classes.memberAvatarZoomStage}>
            {shown.value ? (
              <img
                class={classes.memberAvatarZoomImage}
                src={shown.value.src}
                alt={shown.value.label}
                data-test='member-avatar-zoom-small'
              />
            ) : null}
            {/* The full size arrives on top of the small one: the swap is a sharpening rather
                than a blink, because the small rendition stays until the big one has decoded. */}
            {fullSource.value ? (
              <img
                class={[classes.memberAvatarZoomImage, 'member-avatar-zoom-image-full']}
                src={fullSource.value}
                alt=''
                data-test='member-avatar-zoom-full'
              />
            ) : null}
          </div>
        </div>
      </BModal>
    )
  },
})
