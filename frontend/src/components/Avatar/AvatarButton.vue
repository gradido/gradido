<!-- AI-GENERATED — not an architecture reference -->
<template>
  <div>
    <button
      type="button"
      class="avatar-button"
      :style="{ width: `${size}px`, height: `${size}px` }"
      :title="avatar ? $t('avatar.change') : $t('avatar.set')"
      @click="isCropperOpen = true"
    >
      <AppAvatar
        :size="size"
        :name="name"
        :initials="initials"
        :color="color"
        :src="avatarSource"
        :quiet="!avatar"
      />
      <span class="avatar-overlay">
        <IBiCameraFill />
      </span>
      <span class="avatar-badge" :class="{ 'is-quiet': !avatar }">
        <IBiCameraFill />
      </span>
    </button>

    <AvatarCropper
      v-model="isCropperOpen"
      :has-avatar="Boolean(avatar)"
      @saved="onSaved"
      @removed="onRemoved"
    />
  </div>
</template>

<script setup>
import { useMutation } from '@vue/apollo-composable'
import { computed, ref } from 'vue'
import { useI18n } from 'vue-i18n'
import { useStore } from 'vuex'
import AppAvatar from '@/components/AppAvatar.vue'
import AvatarCropper from '@/components/Avatar/AvatarCropper.vue'
import { useAppToast } from '@/composables/useToast'
import { removeUserAvatar, setUserAvatar } from '@/graphql/mutations'

defineProps({
  size: {
    type: Number,
    default: 61,
  },
  name: {
    type: String,
    default: '',
  },
  initials: {
    type: String,
    default: '',
  },
  color: {
    type: String,
    default: '',
  },
})

const store = useStore()
const toast = useAppToast()
const { t } = useI18n()
const isCropperOpen = ref(false)

const avatar = computed(() => store.state.avatar)
const avatarSource = computed(() => (avatar.value ? `data:image/jpeg;base64,${avatar.value}` : ''))

const { mutate: mutateSet } = useMutation(setUserAvatar)
const { mutate: mutateRemove } = useMutation(removeUserAvatar)

async function onSaved(image) {
  try {
    await mutateSet({ image })
    // Written to the store only after the server accepted it, so the wallet never shows
    // a picture that is not stored.
    store.commit('avatar', image)
    toast.toastSuccess(t('avatar.saved'))
  } catch (error) {
    toast.toastError(error.message)
  }
}

async function onRemoved() {
  try {
    await mutateRemove()
    store.commit('avatar', null)
    toast.toastSuccess(t('avatar.removed'))
  } catch (error) {
    toast.toastError(error.message)
  }
}
</script>

<style lang="scss" scoped>
/* Block comments only: lightningcss parses SFC style blocks and a double slash is not a
   comment to it -- the build fails with "Invalid empty selector". */
.avatar-button {
  position: relative;
  padding: 0;
  border: 0;
  background: none;
  border-radius: 50%;
  cursor: pointer;
  display: block;
}

.avatar-overlay {
  position: absolute;
  inset: 0;
  border-radius: 50%;
  background: rgb(0 0 0 / 42%);
  color: #fff;
  display: flex;
  align-items: center;
  justify-content: center;
  font-size: 22%;
  opacity: 0;
  transition: opacity 0.16s ease;
  pointer-events: none;
}

.avatar-button:hover .avatar-overlay,
.avatar-button:focus-visible .avatar-overlay {
  opacity: 1;
}

.avatar-badge {
  position: absolute;
  right: -1px;
  bottom: -1px;
  width: 26px;
  height: 26px;
  border-radius: 50%;
  background: #047006;
  color: #fff;
  border: 2.5px solid var(--surface, #fff);
  display: flex;
  align-items: center;
  justify-content: center;
  font-size: 14px;
  opacity: 0;
  transform: scale(0.85);
  transition:
    opacity 0.16s ease,
    transform 0.16s ease;
  pointer-events: none;
}

.avatar-button:hover .avatar-badge,
.avatar-button:focus-visible .avatar-badge {
  opacity: 1;
  transform: scale(1);
}

/* No picture yet: the badge stays visible instead of waiting for a hover, because a
   finger does not hover and the wallet is used mostly on phones. Quietly, though --
   no green disc, just the sign in the same colour as the initials next to it. */
.avatar-badge.is-quiet {
  opacity: 1;
  transform: scale(1);
  background: var(--surface, #fff);
  border: 0;
  color: #276e6f;
  right: 0;
  bottom: -2px;
  width: 22px;
  height: 22px;
  font-size: 13px;
}

.dark-mode .avatar-badge.is-quiet {
  background: var(--surface, #2a2c30);
  color: #8ed0d1;
}

.avatar-button:hover .avatar-badge.is-quiet {
  color: #047006;
}
</style>
