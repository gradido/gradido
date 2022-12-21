<template>
  <div class="breadcrumb bg-transparent">
    <!-- eslint-disable-next-line @intlify/vue-i18n/no-dynamic-keys -->
    <h1>{{ pageTitle }}</h1>
    <!-- <div v-switch="path">
      <h2 v-case="'/overview'">overview</h2>
      <h2 v-case="'/send'">send</h2>
      <h2 v-case="'/transactions'">transactions</h2>
      <h2 v-case="'/gdt'">gdt</h2>
      <h2 v-case="'/community'">community</h2>
      <h2 v-case="'/information'">information</h2>
      <h2 v-case="'/settings'">settings</h2>
      <h2 v-default>Default</h2>
    </div>
    {{ this.$route.bread }} -->
  </div>
</template>
<script>
import CONFIG from '@/config'

export default {
  name: 'Breadcrumb',
  computed: {
    pageTitle() {
      const options = { name: this.$store.state.firstName, community: CONFIG.COMMUNITY_NAME }
      // eslint-disable-next-line @intlify/vue-i18n/no-dynamic-keys
      return this.$t(`pageTitle.${this.$route.meta.pageTitle}`, options)
    },
  },
}
</script>
