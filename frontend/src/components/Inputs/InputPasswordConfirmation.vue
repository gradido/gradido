<template>
  <div>
    <BRow class="mb-2">
      <BCol>
        <input-password
          id="new-password-input-field"
          :model-value="password"
          :rules="{
            required: true,
            containsLowercaseCharacter: true,
            containsUppercaseCharacter: true,
            containsNumericCharacter: true,
            atLeastEightCharacters: true,
            atLeastOneSpecialCharater: true,
            noWhitespaceCharacters: true,
          }"
          :label="register ? $t('form.password') : $t('form.password_new')"
          :show-all-errors="true"
          :immediate="true"
          :name="createId(register ? $t('form.password') : $t('form.password_new'))"
          :placeholder="register ? $t('form.password') : $t('form.password_new')"
          @update:modelValue="password = $event"
        />
      </BCol>
    </BRow>
    <BRow class="mb-2">
      <BCol>
        <input-password
          id="repeat-new-password-input-field"
          :model-value="passwordRepeat"
          :rules="{
            required: true,
            samePassword: password,
          }"
          :label="register ? $t('form.passwordRepeat') : $t('form.password_new_repeat')"
          :immediate="true"
          :name="createId(register ? $t('form.passwordRepeat') : $t('form.password_new_repeat'))"
          :placeholder="register ? $t('form.passwordRepeat') : $t('form.password_new_repeat')"
          @update:modelValue="passwordRepeat = $event"
        />
      </BCol>
    </BRow>
  </div>
</template>
<script setup>
import { computed, ref, watch } from 'vue'
import InputPassword from './InputPassword'
import { BCol, BRow } from 'bootstrap-vue-next'

const password = ref('')
const passwordRepeat = ref('')

defineProps({
  modelValue: {
    type: Object,
    required: true,
  },
  register: {
    type: Boolean,
    required: false,
  },
})

const emit = defineEmits(['input'])

const createId = (text) => {
  return text.replace(/ +/g, '-')
}

const passwordObject = computed(() => {
  return { password: password.value, passwordRepeat: passwordRepeat.value }
})

watch(
  [password, passwordRepeat],
  () => {
    emit('input', passwordObject.value)
  },
  { deep: true },
)
</script>
