<template>
  <div id="username_form">
    <div v-if="store.state.username">
      <label>{{ $t('form.username') }}</label>
      <BFormGroup
        class="mb-3"
        data-test="username-input-group"
        :description="$t('settings.emailInfo')"
      >
        <BFormInput
          :model-value="username"
          readonly
          data-test="username-input-readonly"
          @update:modelValue="username = $event"
        />
      </BFormGroup>
    </div>
    <div v-else>
      <div>
        <BForm @submit.prevent="onSubmit">
          <BRow class="mb-3">
            <BCol class="col-12">
              <input-username
                :model-value="username"
                name="username"
                :placeholder="$t('form.username-placeholder')"
                show-all-errors
                :unique="true"
                :rules="rules"
                :is-edit="isEdit"
                data-test="component-input-username"
                @set-is-edit="setIsEdit(true)"
                @update:model-value="username = $event"
              />
            </BCol>
            <BCol class="col-12">
              <div
                v-if="!store.state.username"
                class="alert gradido-border-radius"
                data-test="username-alert"
              >
                {{ $t('settings.username.no-username') }}
              </div>
            </BCol>
          </BRow>
          <BRow v-if="newUsername" class="text-end">
            <BCol>
              <div ref="submitButton" class="text-end">
                <BButton
                  :variant="disabled(errors) ? 'light' : 'success'"
                  type="submit"
                  :disabled="disabled(errors)"
                  data-test="submit-username-button"
                >
                  {{ $t('form.save') }}
                </BButton>
              </div>
            </BCol>
          </BRow>
        </BForm>
      </div>
    </div>
  </div>
</template>

<script setup>
import { ref, computed } from 'vue'
import { useStore } from 'vuex'
import { useMutation } from '@vue/apollo-composable'
import { useI18n } from 'vue-i18n'
import { BRow, BCol, BFormInput, BFormGroup, BForm, BButton } from 'bootstrap-vue-next'
import InputUsername from '@/components/Inputs/InputUsername'
import { updateUserInfos } from '@/graphql/mutations'
import { useAppToast } from '@/composables/useToast'
import { useForm } from 'vee-validate'

const store = useStore()
const { toastError, toastSuccess } = useAppToast()
const { t } = useI18n()

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

const { handleSubmit, errors, values } = useForm()
const { mutate: updateUserInfo } = useMutation(updateUserInfos)

const onSubmit = handleSubmit(async () => {
  try {
    await updateUserInfo({ alias: values.username })
    store.commit('username', values.username)
    toastSuccess(t('settings.username.change-success'))
  } catch (error) {
    toastError(error.message)
  }
})

const setIsEdit = (bool) => {
  username.value = store.state.username
  isEdit.value = bool
}

const newUsername = computed(() => username.value !== store.state.username)

const disabled = (err) => {
  return !newUsername.value || !!Object.keys(err).length
}
</script>

<style>
.cursor-pointer {
  cursor: pointer;
}

div.alert {
  color: red;
}
</style>
