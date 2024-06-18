<template>
  <div>
    <slot v-if="!isEditing" v-bind:isEditing="isEditing" name="view"></slot>
    <slot v-else v-bind:isEditing="isEditing" name="edit" @input="valueChanged"></slot>
    <b-form-group v-if="allowEdit && !isEditing">
      <b-button @click="enableEdit" :variant="variant">
        <b-icon icon="pencil-fill">{{ $t('edit') }}</b-icon>
      </b-button>
    </b-form-group>
    <b-form-group v-else-if="allowEdit && isEditing">
      <b-button @click="save" :variant="variant" :disabled="!isValueChanged">
        {{ $t('save') }}
      </b-button>
      <b-button @click="close" variant="secondary">
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
    },
    close() {
      this.$emit('reset')
      this.isEditing = false
    },
  },
}
</script>
