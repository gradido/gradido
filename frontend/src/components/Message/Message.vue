<template>
  <div>
    <div class="header py-lg-6">
      <!-- The whole width of the card, and the subtitle in regular weight: some subtitles run to
           four sentences (the confirmation after a guarantor-code registration), and at half the
           width in bold that one stood on twelve lines on a phone. -->
      <BContainer>
        <div class="header-body text-center mb-7">
          <p class="h1 test-message-headline">{{ headline }}</p>
          <p class="h4 fw-normal test-message-subtitle">{{ subtitle }}</p>
          <hr />
          <BButton v-if="showButton" class="test-message-button" @click="handleNavigation">
            {{ buttonText }}
          </BButton>
        </div>
      </BContainer>
    </div>
  </div>
</template>

<script setup>
import { computed } from 'vue'
import { useRouter } from 'vue-router'

const props = defineProps({
  headline: { type: String, required: true },
  subtitle: { type: String, required: true },
  buttonText: { type: String, required: false, default: null },
  // Both forms really arrive here: `ForgotPassword.vue` passes the path `/login`, every
  // other caller passes a route object. Declaring only the string made Vue warn on four
  // of six callers.
  linkTo: { type: [String, Object], required: false, default: null },
})

const router = useRouter()

const showButton = computed(() => props.buttonText && props.linkTo)
const buttonLinkTo = computed(() => (props.linkTo ? props.linkTo : null))

const handleNavigation = () => {
  if (buttonLinkTo.value) {
    router.push(buttonLinkTo.value)
  }
}
</script>
