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
                name="username"
                :placeholder="$t('form.username-placeholder')"
                show-all-errors
                :unique="true"
                :rules="rules"
                data-test="component-input-username"
                :initial-username-value="username"
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
import { computed } from 'vue'
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

const username = computed(() => store.state.username || '')

const newUsername = computed(() => values.username && values.username !== store.state.username)

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
