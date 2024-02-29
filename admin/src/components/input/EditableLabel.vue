<template>
  <div>
    <b-form-group>
      <label v-if="!editing">{{ value }}</label>
      <b-form-input v-else v-model="inputValue" :placeholder="placeholder" />
    </b-form-group>
    <b-button
      v-if="allowEdit"
      @click="toggleEdit"
      :disabled="!isValueChanged && editing"
      :variant="variant"
    >
      <b-icon v-if="!editing" icon="pencil-fill" tooltip="$t('edit')"></b-icon>
      <b-icon v-else icon="check" tooltip="$t('save')"></b-icon>
    </b-button>
  </div>
</template>

<script>
export default {
  // Code written from chatGPT 3.5
  name: 'EditableLabel',
  props: {
    value: {
      type: String,
      required: false,
      default: '',
    },
    allowEdit: {
      type: Boolean,
      default: false,
    },
    placeholder: {
      type: String,
      required: false,
      default: '',
    },
  },
  data() {
    return {
      editing: false,
      inputValue: this.value,
      originalValue: this.value,
    }
  },
  computed: {
    variant() {
      return this.editing ? 'success' : 'prime'
    },
    isValueChanged() {
      return this.inputValue !== this.originalValue
    },
  },
  methods: {
    toggleEdit() {
      if (this.editing) {
        this.$emit('save', this.inputValue)
        this.originalValue = this.inputValue
      }
      this.editing = !this.editing
    },
  },
}
</script>
