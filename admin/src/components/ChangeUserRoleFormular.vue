<template>
  <div class="change-user-role-formular">
    <div class="shadow p-3 mb-5 bg-white rounded">
      <div v-if="!isModeratorRoleAdmin" class="m-3 mb-4">
        {{ roles.find((role) => role.value === currentRole.value)?.text }}
      </div>
      <div v-else-if="item.userId === moderatorId" class="m-3 mb-4">
        {{ $t('userRole.notChangeYourSelf') }}
      </div>
      <div v-else class="m-3">
        <label for="role" class="me-3">{{ $t('userRole.selectLabel') }}</label>
        <BFormSelect v-model="roleSelected" class="role-select" :options="roles" />
        <div class="mt-3 mb-5">
          <BButton variant="danger" @click="showModal">
            <!-- :disabled="currentRole.value === roleSelected.value" -->
            {{ $t('change_user_role') }}
          </BButton>
        </div>

        <hr />
        <div class="mb-3">
          <label class="d-block mb-1">{{ $t('userRole.creationGroups.label') }}</label>
          <ThemedSelect
            v-model="userMainTag"
            class="role-select"
            :options="mainTagSelectOptions"
            data-test="user-main-tag"
            @change="saveUserMainTag"
          />
          <small class="d-block text-muted mt-1">{{ $t('userRole.creationGroups.help') }}</small>
        </div>

        <div v-if="showModeratorScope" class="mb-3">
          <label class="d-block mb-1">{{ $t('userRole.scope.label') }}</label>
          <BFormSelect
            v-model="moderatorScope"
            class="role-select"
            :options="scopeSelectOptions"
            multiple
            :select-size="5"
            data-test="moderator-scope"
            @change="saveScope"
          />
          <small class="d-block text-muted mt-1">{{ $t('userRole.scope.help') }}</small>
        </div>
      </div>

      <!-- ES-021: "may create" -- next to the roles, because it is a right, but NOT a role:
           one column on the account, both directions. Administrators only (the mutation is
           behind SET_CREATION_ALLOWED); a moderator sees where the switch stands. Outside
           the v-if/v-else above on purpose: an administrator may flip it on their OWN
           account too, and that branch shows nothing else. -->
      <hr />
      <div class="m-3" data-test="creation-allowed">
        <BFormCheckbox
          v-if="isModeratorRoleAdmin"
          v-model="creationAllowed"
          switch
          :disabled="savingCreationAllowed"
          data-test="creation-allowed-switch"
          @update:model-value="saveCreationAllowed"
        >
          {{ $t('userRole.creationAllowed.label') }}
        </BFormCheckbox>
        <div v-else data-test="creation-allowed-readonly">
          {{ $t('userRole.creationAllowed.label') }}:
          {{
            creationAllowed ? $t('userRole.creationAllowed.yes') : $t('userRole.creationAllowed.no')
          }}
        </div>
        <small class="d-block text-muted mt-1">{{ $t('userRole.creationAllowed.help') }}</small>
      </div>
    </div>
  </div>
</template>

<script setup>
import { ref, computed, watch } from 'vue'
import { useI18n } from 'vue-i18n'
import { BButton, BFormCheckbox, BFormSelect } from 'bootstrap-vue-next'
import { useMutation, useQuery } from '@vue/apollo-composable'
import { creationGroupOption } from '@/utils/creationGroupLabel'
import { setUserRole as setUserRoleMutation } from '../graphql/setUserRole'
import { setCreationAllowed as setCreationAllowedMutation } from '../graphql/setCreationAllowed'
import {
  creationGroups,
  userCreationGroups,
  moderatorCreationGroupScope,
  setUserCreationGroups as setUserCreationGroupsMutation,
  setModeratorCreationGroupScope as setModeratorCreationGroupScopeMutation,
} from '../graphql/creationGroups.graphql'
import { useStore } from 'vuex'
import { useAppToast } from '@/composables/useToast'

const { t } = useI18n()
const store = useStore()
const { toastError, toastSuccess } = useAppToast()

const rolesValues = {
  ADMIN: 'ADMIN',
  MODERATOR: 'MODERATOR',
  MODERATOR_AI: 'MODERATOR_AI',
  USER: 'USER',
}
const props = defineProps({
  item: {
    type: Object,
    required: true,
  },
})
const getCurrentRole = () => {
  if (props.item.role) return rolesValues[props.item.role]
  return rolesValues.USER
}
const currentRole = ref(getCurrentRole())
const roleSelected = ref(getCurrentRole())

const emit = defineEmits(['update-role', 'show-modal', 'select-role', 'update-creation-allowed'])
const isModeratorRoleAdmin = computed(() => store.state.moderator.role === 'ADMIN')
const moderatorId = computed(() => store.state.moderator.id)

const roles = computed(() => [
  { value: rolesValues.USER, text: t('userRole.selectRoles.user') },
  { value: rolesValues.MODERATOR, text: t('userRole.selectRoles.moderator') },
  { value: rolesValues.MODERATOR_AI, text: t('userRole.selectRoles.moderatorAi') },
  { value: rolesValues.ADMIN, text: t('userRole.selectRoles.admin') },
])

// Both moderator kinds carry the same visibility scope — a KI-Moderator is a moderator who
// may additionally use Crea, not a wider role.
const showModeratorScope = computed(
  () =>
    roleSelected.value === rolesValues.MODERATOR || roleSelected.value === rolesValues.MODERATOR_AI,
)

const showModal = async () => {
  emit('show-modal')
}

const { mutate: setUserRole } = useMutation(setUserRoleMutation)

const updateUserRole = (newRole, oldRole) => {
  const role = roles.value.find((role) => role.value === newRole)
  const roleText = role.text
  const roleValue = role.value

  setUserRole({
    userId: props.item.userId,
    role: role.value,
  })
    .then(() => {
      emit('update-role', {
        userId: props.item.userId,
        role: roleValue === 'USER' ? null : roleValue,
      })
      toastSuccess(
        t('userRole.successfullyChangedTo', {
          role: roleText,
        }),
      )
    })
    .catch((error) => {
      roleSelected.value = oldRole
      toastError(error.message)
    })
}

// --- Group functions: user main tag + moderator visibility scope ---
const { result: creationGroupsResult } = useQuery(creationGroups)
const creationGroupOptions = computed(() => creationGroupsResult.value?.creationGroups ?? [])

// The user's personal main tag (pre-filled on submission). Setting it here heals a
// forgotten/misspelled tag at the source, not just on a single contribution.
// network-only plus an explicit refetch after saving: both queries answer with a bare list
// of scalars, which Apollo cannot normalise, so a mutation leaves the cached entry standing.
// The form is mounted and unmounted with the details row, so a cached answer would come
// back on the next open and show the value from before the change.
const { result: userTagsResult, refetch: refetchUserTags } = useQuery(
  userCreationGroups,
  () => ({ userId: props.item.userId }),
  { fetchPolicy: 'network-only' },
)
const userMainTag = ref('')
watch(
  userTagsResult,
  (value) => {
    userMainTag.value = value?.userCreationGroups?.[0]?.tag ?? ''
  },
  { immediate: true },
)
const mainTagSelectOptions = computed(() => [
  { value: '', text: t('userRole.creationGroups.none') },
  ...creationGroupOptions.value.map(creationGroupOption),
])
const { mutate: setUserCreationGroups } = useMutation(setUserCreationGroupsMutation)
const saveUserMainTag = async () => {
  try {
    await setUserCreationGroups({
      userId: props.item.userId,
      tags: userMainTag.value ? [userMainTag.value] : [],
    })
    await refetchUserTags()
    toastSuccess(t('userRole.savedCreationGroups'))
  } catch (error) {
    toastError(error.message)
  }
}

// The moderator's visibility scope: which creation groups they may see/edit. Sentinels
// '*all' (everything) and '*untagged' (contributions without a tag). Empty = all.
const { result: scopeResult, refetch: refetchScope } = useQuery(
  moderatorCreationGroupScope,
  () => ({ userId: props.item.userId }),
  // Only an administrator may read a scope, and only a moderator has one, so asking for
  // every expanded row would earn a 401 per ordinary user.
  { fetchPolicy: 'network-only', enabled: showModeratorScope },
)
const moderatorScope = ref([])
watch(
  scopeResult,
  (value) => {
    moderatorScope.value = value?.moderatorCreationGroupScope ?? []
  },
  { immediate: true },
)
const scopeSelectOptions = computed(() => [
  { value: '*all', text: t('userRole.scope.all') },
  { value: '*untagged', text: t('userRole.scope.untagged') },
  ...creationGroupOptions.value.map(creationGroupOption),
])
const { mutate: setModeratorCreationGroupScope } = useMutation(
  setModeratorCreationGroupScopeMutation,
)
const saveScope = async () => {
  try {
    await setModeratorCreationGroupScope({
      userId: props.item.userId,
      scope: moderatorScope.value,
    })
    await refetchScope()
    toastSuccess(t('userRole.savedScope'))
  } catch (error) {
    toastError(error.message)
  }
}

// --- ES-021: may this account create? ---
// `!== false`: a row from before the field existed says nothing, and nothing means the
// default every account has -- a person who may create.
const creationAllowed = ref(props.item.creationAllowed !== false)
// One request at a time: a second flip while the first is out would let the older answer
// win and hand the table a stale value.
const savingCreationAllowed = ref(false)
const { mutate: setCreationAllowed } = useMutation(setCreationAllowedMutation)
const saveCreationAllowed = async (allowed) => {
  if (savingCreationAllowed.value) {
    return
  }
  savingCreationAllowed.value = true
  try {
    const result = await setCreationAllowed({ userId: props.item.userId, allowed })
    const now = result?.data?.setCreationAllowed ?? allowed
    creationAllowed.value = now
    emit('update-creation-allowed', { userId: props.item.userId, creationAllowed: now })
    toastSuccess(
      now ? t('userRole.creationAllowed.switchedOn') : t('userRole.creationAllowed.switchedOff'),
    )
  } catch (error) {
    // The switch shows the row, not the wish.
    creationAllowed.value = !allowed
    toastError(error.message)
  } finally {
    savingCreationAllowed.value = false
  }
}

defineExpose({ currentRole, roleSelected, updateUserRole, saveCreationAllowed })
</script>

<style>
.role-select {
  width: 300pt;
}
</style>
