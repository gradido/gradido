<template>
  <div>
    <b-input-group>
      <b-form-input
        type="text"
        class="test-input-criteria"
        v-model="currentValue"
        :placeholder="$t('user_search')"
      ></b-form-input>
      <b-input-group-append class="test-click-clear-criteria" @click="currentValue = ''">
        <b-input-group-text class="pointer">
          <b-icon icon="x" />
        </b-input-group-text>
      </b-input-group-append>
    </b-input-group>
  </div>
</template>
<script>
export default {
  name: 'UserQuery',
  props: {
    value: { type: String, default: '' },
  },
  data() {
    return {
      currentValue: this.value,
    }
  },
  watch: {
    currentValue() {
      if (this.value !== this.currentValue) {
        this.$emit('input', this.currentValue)
      }
    },
  },
}
</script>
