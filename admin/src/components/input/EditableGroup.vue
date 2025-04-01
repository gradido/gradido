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

<script>
export default {
  name: 'EditableGroup',
  provide() {
    return {
      editableGroup: {
        valueChanged: this.valueChanged,
        invalidValues: this.invalidValues,
      },
    }
  },
  props: {
    allowEdit: {
      type: Boolean,
      default: false,
    },
  },
  emits: ['save', 'reset'],
  data() {
    return {
      isEditing: false,
      isValueChanged: false,
    }
  },
  computed: {
    variant() {
      return this.isEditing ? 'success' : 'prime'
    },
  },
  methods: {
    enableEdit() {
      this.isEditing = true
    },
    valueChanged() {
      this.isValueChanged = true
    },
    invalidValues() {
      this.isValueChanged = false
    },
    save() {
      this.$emit('save')
      this.isEditing = false
      this.isValueChanged = false
    },
    close() {
      this.$emit('reset')
      this.isEditing = false
      this.isValueChanged = false
    },
  },
}
</script>
