<template>
  <div class="form-user-switch" @click="onClick">
    <b-form-checkbox
      test="BFormCheckbox"
      v-model="value"
      name="check-button"
      :disabled="disabled"
      switch
      @change="onChange"
    ></b-form-checkbox>
  </div>
</template>
<script>
import { updateUserInfos } from '@/graphql/mutations'

export default {
  name: 'UserSettingsSwitch',
  props: {
    initialValue: { type: Boolean, default: false },
    attrName: { type: String },
    enabledText: { type: String },
    disabledText: { type: String },
    disabled: { type: Boolean, default: false },
    notAllowedText: { type: String, default: undefined },
  },
  data() {
    return {
      value: this.initialValue,
    }
  },
  methods: {
    async onChange() {
      if (this.isDisabled) return
      const variables = []
      variables[this.attrName] = this.value
      this.$apollo
        .mutate({
          mutation: updateUserInfos,
          variables,
        })
        .then(() => {
          this.$store.commit(this.attrName, this.value)
          this.$emit('valueChanged', this.value)
          this.toastSuccess(this.value ? this.enabledText : this.disabledText)
        })
        .catch((error) => {
          this.value = this.initialValue
          this.toastError(error.message)
        })
    },
    onClick() {
      if (this.notAllowedText && this.disabled) {
        this.toastError(this.notAllowedText)
      }
    },
  },
}
</script>
