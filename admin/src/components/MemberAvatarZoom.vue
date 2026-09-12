<!-- AI-GENERATED — not an architecture reference -->
<template>
  <BModal
    :model-value="Boolean(shown)"
    :title="shown?.label || $t('avatar.zoom-picture-plain')"
    size="lg"
    centered
    hide-footer
    data-test="member-avatar-zoom"
    @update:model-value="onVisibility"
  >
    <!-- The small rendition first, replaced by the full size when it arrives: a tap is
         answered at once, and never with an empty box. Both are the same element on purpose
         -- swapping `src` on one element makes the browser tear down the old picture before
         the new one has decoded, and the face blinks. -->
    <div class="member-avatar-zoom-stage">
      <img v-if="shown" class="member-avatar-zoom-image" :src="shown.src" :alt="shown.label" />
      <img
        v-if="fullSource"
        class="member-avatar-zoom-image member-avatar-zoom-image-full"
        :src="fullSource"
        :alt="shown?.label"
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
 * when the request goes out: a moderator who closes this window and opens another face
 * before the first answer returns would otherwise be shown the wrong person.
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
      if (!still || still.gradidoID !== asked.gradidoID) return
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
.member-avatar-zoom-stage {
  position: relative;
  display: flex;
  justify-content: center;
}

.member-avatar-zoom-image {
  max-width: 100%;
  max-height: 70vh;
  border-radius: 0.5rem;
}

/* The full size lies exactly over the small one, so its arrival is a sharpening rather than
   a jump. */
.member-avatar-zoom-image-full {
  position: absolute;
  inset: 0;
  margin: auto;
}
</style>
