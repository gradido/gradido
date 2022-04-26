<template>
  <div>
    <!-- Header -->
    <div class="header py-lg-6">
      <b-container class="w-50">
        <div class="header-body text-center mb-7">
          <!-- eslint-disable-next-line @intlify/vue-i18n/no-dynamic-keys-->
          <p class="h1 test-message-headline">{{ headline }}</p>
          <!-- eslint-disable-next-line @intlify/vue-i18n/no-dynamic-keys-->
          <p class="h4 test-message-subtitle">{{ subtitle }}</p>
          <hr />
          <b-button
            v-if="buttonText && (linkTo || callback)"
            class="test-message-button"
            :to="linkTo ? linkTo + (code ? `/${code}` : '') : null"
            @click="callback()"
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
    callback: { type: Function, required: false, default: null },
    code: { type: String, required: false, default: null }, // Wolle: to be removed by adding it directly to the "linkTo"
  },
}
</script>
