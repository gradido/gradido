<template>
  <div class="form-user-switch">
    <b-form-checkbox
      test="BFormCheckbox"
      v-model="value"
      name="check-button"
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
  },
  data() {
    return {
      value: this.initialValue,
    }
  },
  methods: {
    async onChange() {
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
  },
}
</script>
