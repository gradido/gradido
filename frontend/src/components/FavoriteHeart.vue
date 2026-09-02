<!-- AI-GENERATED — not an architecture reference -->
<template>
  <span class="favorite-heart d-inline-flex align-items-center" @click.stop.prevent>
    <BButton
      variant="link"
      class="favorite-heart-button p-0 border-0"
      :class="{ 'is-favorite': favorite, 'with-label': label }"
      :aria-label="favorite ? $t('contacts.heart.remove') : $t('contacts.heart.add')"
      :aria-pressed="favorite ? 'true' : 'false'"
      :disabled="busy"
      data-test="favorite-heart"
      @click="toggle"
    >
      <i-mdi-heart v-if="favorite" class="favorite-heart-icon" aria-hidden="true" />
      <i-mdi-heart-outline v-else class="favorite-heart-icon" aria-hidden="true" />
      <span v-if="label" class="ms-2 favorite-heart-label">
        {{ favorite ? $t('contacts.isFavorite') : $t('contacts.addFavorite') }}
      </span>
    </BButton>

    <!-- The question is asked in ONE direction only (KF-003). Giving the heart by mistake
         costs nothing; taking it away by mistake loses a friend from the list, and a phone
         in a pocket taps -- so removing asks, adding does not. -->
    <BModal
      v-model="confirming"
      centered
      hide-header
      :cancel-title="$t('form.cancel')"
      :ok-title="$t('contacts.remove.confirm')"
      ok-variant="danger"
      data-test="favorite-remove-dialog"
      @ok="remove"
    >
      <p class="h5 mb-2" data-test="favorite-remove-title">
        {{ $t('contacts.remove.title', { name }) }}
      </p>
      <p class="mb-0 text-muted">{{ $t('contacts.remove.body', { name }) }}</p>
    </BModal>
  </span>
</template>

<script setup>
import { computed, ref } from 'vue'
import { useMutation } from '@vue/apollo-composable'
import { BButton, BModal } from 'bootstrap-vue-next'
import { addFavorite, removeFavorite } from '@/graphql/contacts.graphql'
import { isFavorite, markFavorite } from '@/composables/useFavorites'
import { useAppToast } from '@/composables/useToast'
import { memberAlias } from '@/utils/gradidoAddress'

/**
 * The heart, wherever a member is named: booking rows, the last-bookings column, the
 * contact list. One component, so the three places cannot come to behave differently.
 *
 * ★ It sits exactly where the name is a link -- the same condition (a gradidoID on the
 * counterparty) decides both, and a creation row, which has no counterparty, gets
 * neither. The CALLER holds that condition, this component only assumes a member.
 *
 * `@click.stop.prevent` on the wrapper: the booking row toggles its details on a click
 * anywhere in it, and a heart that also unfolded the row would be two actions on one tap.
 */
const props = defineProps({
  /** { communityUuid, gradidoID, alias } -- the counterparty as the booking carries it. */
  member: { type: Object, required: true },
  /** Show the word beside the heart (the contact window does; the rows do not). */
  label: { type: Boolean, default: false },
})

const { toastError } = useAppToast()
const { mutate: mutateAdd } = useMutation(addFavorite)
const { mutate: mutateRemove } = useMutation(removeFavorite)

const favorite = computed(() => isFavorite(props.member))
const name = computed(() => memberAlias(props.member.alias, props.member.gradidoID))
const confirming = ref(false)
const busy = ref(false)

const ref_ = () => ({
  communityUuid: props.member.communityUuid ?? null,
  gradidoID: props.member.gradidoID,
})

const toggle = () => {
  if (busy.value) return
  if (favorite.value) {
    confirming.value = true
  } else {
    add()
  }
}

// Applied on this device first, confirmed by the server after; put back if it fails.
const add = async () => {
  busy.value = true
  markFavorite(props.member, true)
  try {
    await mutateAdd({ ref: ref_() })
  } catch (error) {
    markFavorite(props.member, false)
    toastError(error.message)
  } finally {
    busy.value = false
  }
}

const remove = async () => {
  busy.value = true
  markFavorite(props.member, false)
  try {
    await mutateRemove({ ref: ref_() })
  } catch (error) {
    markFavorite(props.member, true)
    toastError(error.message)
  } finally {
    busy.value = false
  }
}
</script>

<style lang="scss" scoped>
.favorite-heart-button {
  color: var(--text-muted, #6c757d);
  line-height: 1;
  text-decoration: none;
}

.favorite-heart-button.is-favorite {
  color: #d64550;
}

.favorite-heart-icon {
  width: 1.35em;
  height: 1.35em;
}

.favorite-heart-label {
  font-size: 0.9rem;
}
</style>
