<template>
  <div>
    <BRow class="mb-2">
      <BCol>
        <input-password
          id="new-password-input-field"
          :model-value="password"
          :label="register ? $t('form.password') : $t('form.password_new')"
          :show-all-errors="true"
          :immediate="true"
          name="passwordNew"
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
          :label="register ? $t('form.passwordRepeat') : $t('form.password_new_repeat')"
          :immediate="true"
          name="passwordRepeat"
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
  register: {
    type: Boolean,
    required: false,
  },
})

const emit = defineEmits(['input'])

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
