<template>
  <div style="position: fixed; bottom: 0px; width: 100%; text-align: center">
    <b-form-checkbox v-model="checked" @change="updateChecked" name="check-button" switch>
      {{ checked ? $t('backgroundAnimationON') : $t('backgroundAnimationOFF') }}
    </b-form-checkbox>
  </div>
</template>

<script>
export default {
  props: {
    checked: { type: Boolean, default: true },
  },
  methods: {
    updateChecked() {
      this.$emit('input', this.checked)
    },
  },
}
</script>
