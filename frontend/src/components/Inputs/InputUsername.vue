<template>
  <div class="input-username">
    <validation-provider
      v-slot="{ errors, valid, validated, ariaInput, ariaMsg }"
      tag="div"
      :rules="rules"
      :name="name"
      :bails="!showAllErrors"
      :immediate="immediate"
      vid="username"
    >
      <b-form-group :label="$t('form.username')" :description="$t('settings.usernameInfo')">
        <b-input-group>
          <b-form-input
            v-bind="ariaInput"
            :id="labelFor"
            v-model="currentValue"
            :name="name"
            :placeholder="placeholder"
            type="text"
            :state="validated ? valid : false"
            autocomplete="off"
            data-test="username"
          ></b-form-input>
          <b-input-group-append>
            <b-button
              size="lg"
              text="Button"
              variant="secondary"
              icon="x-lg"
              @click="$emit('set-is-edit', false)"
            >
              <b-icon-x-circle></b-icon-x-circle>
            </b-button>
          </b-input-group-append>
        </b-input-group>
        <b-form-invalid-feedback v-bind="ariaMsg">
          <div v-if="showAllErrors">
            <span v-for="error in errors" :key="error">
              {{ error }}
              <br />
            </span>
          </div>
          <div v-else>
            {{ errors[0] }}
          </div>
        </b-form-invalid-feedback>
      </b-form-group>
    </validation-provider>
  </div>
</template>
<script>
export default {
  name: 'InputUsername',
  props: {
    isEdit: { type: Boolean, default: false },
    rules: {
      default: () => {
        return {
          required: true,
        }
      },
      type: () => {},
    },
    name: { type: String, default: 'username' },
    label: { type: String, default: 'Username' },
    placeholder: { type: String, default: 'Username' },
    value: { required: true, type: String },
    showAllErrors: { type: Boolean, default: false },
    immediate: { type: Boolean, default: false },
    unique: { type: Boolean, required: true },
  },
  data() {
    return {
      currentValue: this.value,
    }
  },
  computed: {
    labelFor() {
      return this.name + '-input-field'
    },
  },
  watch: {
    currentValue() {
      this.$emit('input', this.currentValue)
    },
  },
}
</script>
