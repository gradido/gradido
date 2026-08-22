<!-- AI-GENERATED — not an architecture reference -->
<template>
  <settings-section :title="$t('settings.menu.account')">
    <BRow>
      <BCol cols="12" md="6" lg="6">
        <user-name />
      </BCol>
      <BCol cols="12" md="6" lg="6">
        <user-email />
      </BCol>
    </BRow>

    <hr />
    <BForm @submit.prevent="onSubmit">
      <BRow class="mt-3">
        <BCol cols="12" md="6" lg="6">
          <label>{{ $t('form.firstname') }}</label>
          <BFormInput
            :model-value="firstName"
            :placeholder="$t('settings.name.enterFirstname')"
            data-test="firstname"
            trim
            @update:modelValue="firstName = $event"
          />
        </BCol>
        <BCol cols="12" md="6" lg="6">
          <label>{{ $t('form.lastname') }}</label>
          <BFormInput
            :model-value="lastName"
            :placeholder="$t('settings.name.enterLastname')"
            data-test="lastname"
            trim
            @update:modelValue="lastName = $event"
          />
        </BCol>
      </BRow>
      <div v-if="isButtonVisible" class="mt-4 pt-4 text-center">
        <BButton
          type="submit"
          variant="primary"
          data-test="submit-userdata"
          @click.prevent="onSubmit"
        >
          {{ $t('form.save') }}
        </BButton>
      </div>
    </BForm>

    <hr />
    <div class="mt-5">{{ $t('form.password') }}</div>
    <user-password />
  </settings-section>
</template>
<script setup>
import SettingsSection from '@/components/UserSettings/SettingsSection.vue'
import { computed, ref } from 'vue'
import { useStore } from 'vuex'
import { useI18n } from 'vue-i18n'
import { useMutation } from '@vue/apollo-composable'
import { updateUserInfos } from '@/graphql/mutations'
import { useAppToast } from '@/composables/useToast'
import UserName from '@/components/UserSettings/UserName.vue'
import UserEmail from '@/components/UserSettings/UserEmail.vue'
import UserPassword from '@/components/UserSettings/UserPassword'
import { BRow, BCol, BForm, BFormInput, BButton } from 'bootstrap-vue-next'

const { t } = useI18n()
const { toastError, toastSuccess } = useAppToast()
const store = useStore()
const state = store.state

const firstName = ref(state.firstName || '')
const lastName = ref(state.lastName || '')

const isButtonVisible = computed(() => {
  return firstName.value !== state.firstName || lastName.value !== state.lastName
})

const { mutate: updateUserData } = useMutation(updateUserInfos)

const onSubmit = async () => {
  try {
    await updateUserData({
      firstName: firstName.value,
      lastName: lastName.value,
    })
    store.commit('firstName', firstName.value)
    store.commit('lastName', lastName.value)
    toastSuccess(t('settings.name.change-success'))
  } catch (error) {
    toastError(error)
  }
}
</script>
