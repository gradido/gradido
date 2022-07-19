<template>
  <div>
    <div class="header py-lg-6">
      <b-container class="w-50">
        <div class="header-body text-center mb-7">
          <p class="h1 test-message-headline">{{ headline }}</p>
          <p class="h4 test-message-subtitle">{{ subtitle }}</p>
          <hr />
          <b-button v-if="showButton" class="test-message-button" :to="buttonLinkTo">
            {{ buttonText }}
          </b-button>
        </div>
      </b-container>
    </div>
  </div>
</template>

<script>
export default {
  name: 'Message',
  props: {
    headline: { type: String, required: true },
    subtitle: { type: String, required: true },
    buttonText: { type: String, required: false, default: null },
    linkTo: { type: String, required: false, default: null },
  },
  computed: {
    showButton() {
      return this.buttonText && this.linkTo
    },
    buttonLinkTo() {
      return this.linkTo ? this.linkTo : null
    },
  },
}
</script>
