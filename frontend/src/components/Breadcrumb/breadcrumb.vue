<template>
  <!--
    ⛔ The BOX stays even with nothing in it, and that is not tidiness: below 450px the
    navigation bar is `position: fixed`, and this box's `margin-top: 3rem` is the only
    thing holding the page out from under it. Take the box away with the heading and the
    content slides underneath on exactly the device the space was being won for.

    A route that names no `pageTitle` shows no heading -- which is how a page asks for its
    own vertical space back. (Bernd, 22.08.2026: the phone needs the room.)
  -->
  <div class="page-breadcrumb breadcrumb bg-transparent" :class="{ 'is-untitled': !pageTitle }">
    <h1 v-if="pageTitle" data-test="page-title">{{ pageTitle }}</h1>
  </div>
</template>
<script>
import CONFIG from '@/config'

export default {
  name: 'Breadcrumb',
  computed: {
    pageTitle() {
      // No key, no heading -- rather than the string "pageTitle.undefined", which is what
      // a missing meta used to print.
      if (!this.$route.meta.pageTitle) {
        return ''
      }
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

/* Empty: keep the top clearance, give back everything that only served the heading. */
.page-breadcrumb.is-untitled {
  padding-bottom: 0;
  margin-bottom: 0;
}

@media screen and (width <= 450px) {
  .page-breadcrumb {
    margin-top: 3rem;
  }
}
</style>
