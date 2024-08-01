<template>
  <div class="change-user-role-formular">
    <div class="shadow p-3 mb-5 bg-white rounded">
      <div v-if="!isModeratorRoleAdmin" class="m-3 mb-4">
        {{ roles.find((role) => role.value === currentRole.value).text }}
      </div>
      <div v-else-if="item.userId === moderatorId" class="m-3 mb-4">
        {{ $t('userRole.notChangeYourSelf') }}
      </div>
      <div v-else class="m-3">
        <label for="role" class="mr-3">{{ $t('userRole.selectLabel') }}</label>
        <BFormSelect v-model="roleSelected" class="role-select" :options="roles" />
        <div class="mt-3 mb-5">
          <BButton variant="danger" @click="showModal">
            <!-- :disabled="currentRole.value === roleSelected.value" -->
            {{ $t('change_user_role') }}
          </BButton>
        </div>
      </div>
    </div>
  </div>
</template>

<script setup>
import { ref, computed } from 'vue'
import { useI18n } from 'vue-i18n'
import { BButton, BFormSelect } from 'bootstrap-vue-next'
import { useMutation } from '@vue/apollo-composable'
import { setUserRole as setUserRoleMutation } from '../graphql/setUserRole'
import { useStore } from 'vuex'
import { useAppToast } from '@/composables/useToast'

const { t } = useI18n()
const store = useStore()
const { toastError, toastSuccess } = useAppToast()

const rolesValues = {
  ADMIN: 'ADMIN',
  MODERATOR: 'MODERATOR',
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
  { value: rolesValues.ADMIN, text: t('userRole.selectRoles.admin') },
])

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

defineExpose({ currentRole, roleSelected, updateUserRole })
</script>

<style>
.role-select {
  width: 300pt;
}
</style>
