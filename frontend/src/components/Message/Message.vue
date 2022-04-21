<template>
  <div>
    <!-- Header -->
    <div class="header py-lg-6">
      <b-container>
        <div class="header-body text-center mb-7">
          <!-- eslint-disable-next-line @intlify/vue-i18n/no-dynamic-keys-->
          <p class="h1 test-message-headline">{{ headline }}</p>
          <!-- eslint-disable-next-line @intlify/vue-i18n/no-dynamic-keys-->
          <p class="h4 test-message-subtitle">{{ subtitle }}</p>
          <hr />
          <b-button
            v-if="buttonText"
            class="test-message-button"
            :to="linkTo + (code ? `/${code}` : '')"
          >
            <!-- eslint-disable-next-line @intlify/vue-i18n/no-dynamic-keys-->
            {{ buttonText }}
          </b-button>
        </div>
      </b-container>
    </div>
    <!-- Page content -->
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
    code: { type: String, required: false, default: null },
  },
}
</script>
