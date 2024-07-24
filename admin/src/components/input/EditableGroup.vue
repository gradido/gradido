<template>
  <div>
    <slot v-if="!isEditing" :is-editing="isEditing" name="view"></slot>
    <slot v-else :is-editing="isEditing" name="edit" @input="valueChanged"></slot>
    <b-form-group v-if="allowEdit && !isEditing">
      <b-button :variant="variant" @click="enableEdit">
        <b-icon icon="pencil-fill">{{ $t('edit') }}</b-icon>
      </b-button>
    </b-form-group>
    <b-form-group v-else-if="allowEdit && isEditing">
      <b-button :variant="variant" :disabled="!isValueChanged" class="save-button" @click="save">
        {{ $t('save') }}
      </b-button>
      <b-button variant="secondary" class="close-button" @click="close">
        {{ $t('close') }}
      </b-button>
    </b-form-group>
  </div>
</template>

<script>
export default {
  name: 'EditableGroup',
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
    },
  },
}
</script>
