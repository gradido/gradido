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
          <label class="d-block mb-1">{{ $t('userRole.groupTags.label') }}</label>
          <ThemedSelect
            v-model="userMainTag"
            class="role-select"
            :options="mainTagSelectOptions"
            data-test="user-main-tag"
            @change="saveUserMainTag"
          />
          <small class="d-block text-muted mt-1">{{ $t('userRole.groupTags.help') }}</small>
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
    </div>
  </div>
</template>

<script setup>
import { ref, computed, watch } from 'vue'
import { useI18n } from 'vue-i18n'
import { BButton, BFormSelect } from 'bootstrap-vue-next'
import { useMutation, useQuery } from '@vue/apollo-composable'
import { groupTagOption } from '@/utils/groupTagLabel'
import { setUserRole as setUserRoleMutation } from '../graphql/setUserRole'
import {
  groupTags,
  userGroupTags,
  moderatorGroupScope,
  setUserGroupTags as setUserGroupTagsMutation,
  setModeratorGroupScope as setModeratorGroupScopeMutation,
} from '../graphql/groupTags.graphql'
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
  if (props.item.roles.length) return rolesValues[props.item.roles[0]]
  return rolesValues.USER
}
const currentRole = ref(getCurrentRole())
const roleSelected = ref(getCurrentRole())

const emit = defineEmits(['update-roles', 'show-modal', 'select-role'])
const isModeratorRoleAdmin = computed(() => store.state.moderator.roles.includes('ADMIN'))
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
      emit('update-roles', {
        userId: props.item.userId,
        roles: roleValue === 'USER' ? [] : [roleValue],
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
const { result: groupTagsResult } = useQuery(groupTags)
const groupTagOptions = computed(() => groupTagsResult.value?.groupTags ?? [])

// The user's personal main tag (pre-filled on submission). Setting it here heals a
// forgotten/misspelled tag at the source, not just on a single contribution.
// network-only plus an explicit refetch after saving: both queries answer with a bare list
// of scalars, which Apollo cannot normalise, so a mutation leaves the cached entry standing.
// The form is mounted and unmounted with the details row, so a cached answer would come
// back on the next open and show the value from before the change.
const { result: userTagsResult, refetch: refetchUserTags } = useQuery(
  userGroupTags,
  () => ({ userId: props.item.userId }),
  { fetchPolicy: 'network-only' },
)
const userMainTag = ref('')
watch(
  userTagsResult,
  (value) => {
    userMainTag.value = value?.userGroupTags?.[0]?.tag ?? ''
  },
  { immediate: true },
)
const mainTagSelectOptions = computed(() => [
  { value: '', text: t('userRole.groupTags.none') },
  ...groupTagOptions.value.map(groupTagOption),
])
const { mutate: setUserGroupTags } = useMutation(setUserGroupTagsMutation)
const saveUserMainTag = async () => {
  try {
    await setUserGroupTags({
      userId: props.item.userId,
      tags: userMainTag.value ? [userMainTag.value] : [],
    })
    await refetchUserTags()
    toastSuccess(t('userRole.savedGroupTags'))
  } catch (error) {
    toastError(error.message)
  }
}

// The moderator's visibility scope: which group tags they may see/edit. Sentinels
// '*all' (everything) and '*untagged' (contributions without a tag). Empty = all.
const { result: scopeResult, refetch: refetchScope } = useQuery(
  moderatorGroupScope,
  () => ({ userId: props.item.userId }),
  // Only an administrator may read a scope, and only a moderator has one, so asking for
  // every expanded row would earn a 401 per ordinary user.
  { fetchPolicy: 'network-only', enabled: showModeratorScope },
)
const moderatorScope = ref([])
watch(
  scopeResult,
  (value) => {
    moderatorScope.value = value?.moderatorGroupScope ?? []
  },
  { immediate: true },
)
const scopeSelectOptions = computed(() => [
  { value: '*all', text: t('userRole.scope.all') },
  { value: '*untagged', text: t('userRole.scope.untagged') },
  ...groupTagOptions.value.map(groupTagOption),
])
const { mutate: setModeratorGroupScope } = useMutation(setModeratorGroupScopeMutation)
const saveScope = async () => {
  try {
    await setModeratorGroupScope({
      userId: props.item.userId,
      scope: moderatorScope.value,
    })
    await refetchScope()
    toastSuccess(t('userRole.savedScope'))
  } catch (error) {
    toastError(error.message)
  }
}

defineExpose({ currentRole, roleSelected, updateUserRole })
</script>

<style>
.role-select {
  width: 300pt;
}
</style>
