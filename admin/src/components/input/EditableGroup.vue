<template>
  <div>
    <slot v-if="!isEditing" :is-editing="isEditing" name="view" />
    <slot v-else :is-editing="isEditing" name="edit" @update:model-value="valueChanged" />
    <BFormGroup v-if="allowEdit && !isEditing">
      <BButton :variant="variant" @click="enableEdit">
        <IBiPencilFill />
        {{ $t('edit') }}
      </BButton>
    </BFormGroup>
    <BFormGroup v-else-if="allowEdit && isEditing">
      <BButton :variant="variant" :disabled="!isValueChanged" class="save-button" @click="save">
        {{ $t('save') }}
      </BButton>
      <BButton variant="secondary" class="close-button ms-2" @click="close">
        {{ $t('close') }}
      </BButton>
    </BFormGroup>
  </div>
</template>

<script setup>
import { computed, provide, ref } from 'vue'

defineProps({
  allowEdit: {
    type: Boolean,
    default: false,
  },
})

const emit = defineEmits(['save', 'reset'])

const isEditing = ref(false)
const isValueChanged = ref(false)

const variant = computed(() => (isEditing.value ? 'success' : 'prime'))

const enableEdit = () => {
  isEditing.value = true
}
const valueChanged = () => {
  isValueChanged.value = true
}
const invalidValues = () => {
  isValueChanged.value = false
}
const save = () => {
  emit('save')
  isEditing.value = false
  isValueChanged.value = false
}
const close = () => {
  emit('reset')
  isEditing.value = false
  isValueChanged.value = false
}

provide('editableGroup', { valueChanged, invalidValues })
</script>
