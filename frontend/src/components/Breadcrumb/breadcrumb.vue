<template>
  <div class="page-breadcrumb breadcrumb bg-transparent">
    <h1>{{ pageTitle }}</h1>
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

<style scoped>
.page-breadcrumb {
  margin-bottom: 1rem;
  padding: 0.75rem 1rem;
}
@media screen and (max-width: 450px) {
  .page-breadcrumb {
    margin-top: 3rem;
  }
}
</style>
