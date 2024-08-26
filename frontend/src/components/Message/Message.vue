<template>
  <div>
    <div class="header py-lg-6">
      <BContainer class="w-50">
        <div class="header-body text-center mb-7">
          <p class="h1 test-message-headline">{{ headline }}</p>
          <p class="h4 test-message-subtitle">{{ subtitle }}</p>
          <hr />
          <BButton v-if="showButton" class="test-message-button" @click="handleNavigation">
            {{ buttonText }}
          </BButton>
        </div>
      </BContainer>
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
  methods: {
    handleNavigation() {
      if (this.buttonLinkTo) {
        this.$router.push(this.buttonLinkTo)
      }
    },
  },
}
</script>
