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
            @update:modelValue="currentValue = $event"
          />
          <BButton size="lg" text="Button" variant="secondary" @click="emitSetIsEdit" append>
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
            <!-- {{ errors?.[0] }} -->
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
  value: { type: String, required: true },
  showAllErrors: { type: Boolean, default: false },
  immediate: { type: Boolean, default: false },
  unique: { type: Boolean, required: true },
})

const currentValue = ref(props?.value)

const { errors, valid, validated, ariaInput, ariaMsg } = useForm({
  initialValues: currentValue.value,
})

const emit = defineEmits(['input', 'set-is-edit'])

const labelFor = computed(() => `${props.name}-input-field`)

const emitSetIsEdit = (bool) => {
  emit('set-is-edit', bool)
}

watch(currentValue, (newValue) => {
  emit('input', newValue)
})
</script>
