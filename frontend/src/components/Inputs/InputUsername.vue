<template>
  <div class="input-username">
    <div>
      <BFormGroup :label="$t('form.username')" :description="$t('settings.usernameInfo')">
        <BInputGroup>
          <BFormInput
            :id="labelFor"
            :model-value="usernameValue"
            :name="name"
            :placeholder="placeholder"
            type="text"
            :state="usernameMeta.valid"
            autocomplete="off"
            data-test="username"
            @update:modelValue="usernameValue = $event"
          />
          <BButton size="md" text="Button" variant="secondary" append @click="clearInput">
            <IBiXCircle style="height: 17px; width: 17px" />
          </BButton>
        </BInputGroup>
        <BFormInvalidFeedback v-if="usernameError || usernameErrors.length" force-show>
          <template #default>
            <div v-if="props.showAllErrors">
              <span v-for="error in usernameErrors" :key="error">
                {{ error }}
                <br />
              </span>
            </div>
            <div v-else>
              {{ usernameErrors?.[0] }}
            </div>
          </template>
        </BFormInvalidFeedback>
      </BFormGroup>
    </div>
  </div>
</template>
<script setup>
import {
  BFormGroup,
  BInputGroup,
  BFormInput,
  BButton,
  BFormInvalidFeedback,
} from 'bootstrap-vue-next'
import { ref, computed, watch, defineProps, defineEmits } from 'vue'
import { useField, useForm } from 'vee-validate'

const props = defineProps({
  rules: { type: Object, default: () => ({ required: true }) },
  name: { type: String, default: 'username' },
  label: { type: String, default: 'Username' },
  placeholder: { type: String, default: 'Username' },
  showAllErrors: { type: Boolean, default: false },
  immediate: { type: Boolean, default: false },
  unique: { type: Boolean, required: true },
  initialUsernameValue: { type: String, default: '' },
})

const currentValue = ref(props.initialUsernameValue)

const {
  meta: usernameMeta,
  errors: usernameErrors,
  value: usernameValue,
  errorMessage: usernameError,
} = useField(props.name, props.rules, {
  initialValue: currentValue,
})

const clearInput = () => (usernameValue.value = '')

const labelFor = computed(() => `${props.name}-input-field`)
</script>

<style>
div#username_form > div > label {
  margin-bottom: 8px;
}
</style>
