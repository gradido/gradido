<template>
  <div role="group" class="first-name">
    <label for="input-firstName">{{ $t('form.firstname') }}</label>
    <b-form-input
      id="input-firstName"
      v-model="firstName"
      :state="firstNameState"
      aria-describedby="input-live-help input-live-feedback"
      placeholder="Enter your firstName"
      trim
    ></b-form-input>

    <!-- This will only be shown if the preceding input has an invalid state -->
    <!-- <b-form-invalid-feedback id="input-live-feedback">
      Enter at least 3 letters
    </b-form-invalid-feedback> -->

    <!-- This is a form text block (formerly known as help block) -->
    <!-- <b-form-text id="input-live-help">Dein Vorname</b-form-text> -->
  </div>
</template>

<script setup>
import { computed, ref } from 'vue'

const props = defineProps({
  value: { type: String, default: '' },
})

const firstName = ref(props.value)

const firstNameState = computed(() => firstName.value.length > 2)
</script>
