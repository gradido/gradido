<template>
  <div class="input-username">
    <div>
      <BFormGroup :label="$t('form.username')" :description="$t('settings.usernameInfo')">
        <BInputGroup>
          <BFormInput
            v-bind="ariaInput"
            :id="labelFor"
            :model-value="currentValue"
            :name="name"
            :placeholder="placeholder"
            type="text"
            :state="validated ? valid : false"
            autocomplete="off"
            data-test="username"
            @update:modelValue="updateValue"
          />
          <BButton size="md" text="Button" variant="secondary" append @click="emitSetIsEdit">
            <IBiXCircle style="height: 17px; width: 17px" />
          </BButton>
        </BInputGroup>
        <BFormInvalidFeedback v-bind="ariaMsg">
          <div v-if="showAllErrors">
            <span v-for="error in errors" :key="error">
              {{ error }}
              <br />
            </span>
          </div>
          <div v-else>
            {{ errors?.[0] }}
          </div>
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
import { useForm } from 'vee-validate'

const props = defineProps({
  isEdit: { type: Boolean, default: false },
  rules: { type: Object, default: () => ({ required: true }) },
  name: { type: String, default: 'username' },
  label: { type: String, default: 'Username' },
  placeholder: { type: String, default: 'Username' },
  modelValue: { type: String, required: true },
  showAllErrors: { type: Boolean, default: false },
  immediate: { type: Boolean, default: false },
  unique: { type: Boolean, required: true },
})

const currentValue = ref(props?.modelValue)

const { errors, valid, validated, ariaInput, ariaMsg } = useForm({
  initialValues: currentValue.value,
})

const emit = defineEmits(['update:modelValue', 'set-is-edit'])

const labelFor = computed(() => `${props.name}-input-field`)

const emitSetIsEdit = (bool) => {
  emit('set-is-edit', bool)
}

const updateValue = (e) => {
  currentValue.value = e
  emit('update:modelValue', e)
}
</script>
