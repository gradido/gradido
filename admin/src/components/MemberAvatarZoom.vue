<!-- AI-GENERATED — not an architecture reference -->
<template>
  <BModal
    :model-value="Boolean(shown)"
    :aria-label="shown?.label || $t('avatar.zoom-picture-plain')"
    centered
    no-header
    no-footer
    content-class="member-avatar-zoom-content"
    body-class="member-avatar-zoom-body"
    data-test="member-avatar-zoom"
    @update:model-value="onVisibility"
  >
    <!-- ⛔ `no-header` / `no-footer`, NOT `hide-header` / `hide-footer`. bootstrap-vue-next
         declares `noHeader`/`noFooter`; the `hide…` spelling occurs NOWHERE in the built
         package (measured: 30 and 8 against 0 and 0). Written the other way the prop is
         dropped in silence and the modal keeps its default footer -- which is how a picture
         came to be opened with a Cancel and an OK button behind it (Bernd, 12.09.2026). The
         wallet's ContactWindow carries the same note: the house has now paid for this name
         twice.

         A picture needs neither a title bar nor buttons: it closes on a tap beside it or with
         Escape, both of which the modal does by itself. The name a header would have carried
         goes to `aria-label`, so a screen reader still says whose face this is. -->
    <div class="member-avatar-zoom-stage">
      <!-- ⛔ A round box of a FIXED size, and both pictures fill it. The full size used to be
           laid over the small one with `inset: 0`, which centres it on a box the size of the
           SMALL rendition -- so it spilled out over the modal's own edges, above and below,
           and the white box cut the circle (Bernd, 12.09.2026). Here nothing can overflow:
           the box is the box, and `object-fit: cover` decides what of the picture fills it.
           Same presentation as the wallet's zoom, for the same picture. -->
      <img
        v-if="shown"
        class="member-avatar-zoom-image"
        :src="shown.src"
        :alt="shown.label"
        data-test="member-avatar-zoom-small"
      />
      <!-- The full size arrives on top of the small one: the swap is a sharpening rather than
           a blink, because the small rendition stays until the big one has decoded. -->
      <img
        v-if="fullSource"
        class="member-avatar-zoom-image member-avatar-zoom-image-full"
        :src="fullSource"
        alt=""
        data-test="member-avatar-zoom-full"
      />
    </div>
  </BModal>
</template>

<script setup>
import { ref, watch } from 'vue'
import { useApolloClient } from '@vue/apollo-composable'
import { memberAvatarFull } from '@/graphql/memberAvatars'
import { closeMemberAvatarZoom, memberAvatarZoomState } from '@/composables/useMemberAvatarZoom'

const shown = memberAvatarZoomState
const { client: apolloClient } = useApolloClient()

const fullSource = ref('')

const onVisibility = (open) => {
  if (!open) closeMemberAvatarZoom()
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
    if (!current) return
    const asked = current.member
    try {
      const { data } = await apolloClient.query({
        query: memberAvatarFull,
        variables: { ref: { gradidoID: asked.gradidoID, communityUuid: asked.communityUuid } },
        fetchPolicy: 'no-cache',
      })
      const still = memberAvatarZoomState.value?.member
      if (
        !still ||
        still.gradidoID !== asked.gradidoID ||
        still.communityUuid !== asked.communityUuid
      ) {
        return
      }
      if (!data?.memberAvatarFull) return
      fullSource.value = `data:image/jpeg;base64,${data.memberAvatarFull}`
    } catch {
      // nothing to say and nothing to do
    }
  },
  { immediate: true },
)
</script>

<style scoped>
/* The picture's own box: as large as the window allows, never larger than the stored picture
   stays sharp for (512), and square, because a face is shown round. */
.member-avatar-zoom-stage {
  position: relative;
  width: min(70vh, 70vw, 512px);
  aspect-ratio: 1;
}

.member-avatar-zoom-image {
  position: absolute;
  inset: 0;
  width: 100%;
  height: 100%;
  object-fit: cover;
  border-radius: 50%;
}
</style>

<style>
/* ⛔ NOT scoped, and it cannot be: these two classes are handed to `BModal` and land on ITS
   elements, which do not carry this component's scope attribute -- a scoped rule would
   compile to `.member-avatar-zoom-content[data-v-…]` and match nothing. `:deep()` does not
   help either, because the modal teleports its content out of this component's subtree.
   Both names are prefixed for exactly that reason: they are global. */
.member-avatar-zoom-content {
  background: transparent;
  border: 0;
  box-shadow: none;
}

.member-avatar-zoom-body {
  display: flex;
  justify-content: center;
  padding: 0;
}
</style>
