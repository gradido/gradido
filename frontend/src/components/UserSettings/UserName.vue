<template>
  <div id="username_form">
    <div v-if="store.state.username">
      <label>{{ $t('form.username') }}</label>
      <BFormGroup
        class="mb-3"
        data-test="username-input-group"
        :description="$t('settings.emailInfo')"
      >
        <BFormInput v-model="username" readonly data-test="username-input-readonly" />
      </BFormGroup>
    </div>
    <div v-else>
      <!-- <validation-observer ref="usernameObserver" v-slot="{ handleSubmit, invalid }">-->
      <div>
        <!-- <BForm @submit.stop.prevent="handleSubmit(onSubmit)"> -->
        <BRow class="mb-3">
          <BCol class="col-12">
            <input-username
              v-model="username"
              :name="$t('form.username')"
              :placeholder="$t('form.username-placeholder')"
              :showAllErrors="true"
              :unique="true"
              :rules="rules"
              :isEdit="isEdit"
              @set-is-edit="setIsEdit"
              data-test="component-input-username"
            />
          </BCol>
          <BCol class="col-12">
            <div v-if="!username" class="alert" data-test="username-alert">
              {{ $t('settings.username.no-username') }}
            </div>
          </BCol>
        </BRow>
        <BRow class="text-right" v-if="newUsername">
          <BCol>
            <div class="text-right" ref="submitButton">
              <BButton
                :variant="disabled(invalid) ? 'light' : 'success'"
                type="submit"
                :disabled="disabled(invalid)"
                data-test="submit-username-button"
              >
                {{ $t('form.save') }}
              </BButton>
            </div>
          </BCol>
        </BRow>
        <!-- </BForm> -->
      </div>
      <!-- </validation-observer> -->
    </div>
  </div>
</template>

<script setup>
import { ref, computed } from 'vue'
import { useStore } from 'vuex'
import { useMutation } from '@vue/apollo-composable'
import { BRow, BCol, BFormInput, BFormGroup, BForm, BButton } from 'bootstrap-vue-next'
import InputUsername from '@/components/Inputs/InputUsername'
import { updateUserInfos } from '@/graphql/mutations'
import { useAppToast } from '@/composables/useToast'
import { useForm } from 'vee-validate'

const store = useStore()
const { toastError, toastSuccess } = useAppToast()

const isEdit = ref(false)
const username = ref(store.state.username || '')
const usernameUnique = ref(false)
const rules = {
  required: true,
  min: 3,
  max: 20,
  usernameAllowedChars: true,
  usernameHyphens: true,
  usernameUnique: true,
}

const { handleSubmit, invalid } = useForm({
  initialValues: username.value,
})

const { mutate: updateUserInfo } = useMutation(updateUserInfos)

const onSubmit = async () => {
  try {
    await updateUserInfo({ alias: username.value })
    store.commit('username', username.value)
    toastSuccess(t('settings.username.change-success'))
  } catch (error) {
    toastError(error.message)
  }
}

const disabled = (invalid) => {
  return !newUsername.value || invalid
}

const setIsEdit = (bool) => {
  username.value = store.state.username
  isEdit.value = bool
}

const newUsername = computed(() => username.value !== store.state.username)
</script>

<style>
.cursor-pointer {
  cursor: pointer;
}

div.alert {
  color: red;
}
</style>
