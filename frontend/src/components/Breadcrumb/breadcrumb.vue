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
  /* ⚠️ Half of the clearance under the fixed navbar. The other half is the `padding-top` on
     `.breadcrumb` in layouts/DashboardLayout.vue, and the note on what the two have to add
     up to lives there. Change one, read the other. */
  .page-breadcrumb {
    margin-top: 3rem;
  }

  /*
    The heading needed 28px more room when the navbar grew a second row of till tools, and it
    is paid for here rather than by pushing the whole page down: 8 + 12 taken out of the 36px
    that stood between the heading and the content (the h1's own 8px stays). The heading moves
    28px, the page 8px.

    ⛔ Titled pages only. An untitled box gives everything back that served the heading (rule
    above) and keeps just the top clearance -- an unqualified value here would hand it 4px of
    that back, on exactly the phones the space was won for. (Bernd, 22.08.2026)
  */
  .page-breadcrumb:not(.is-untitled) {
    padding-bottom: 0.25rem;
    margin-bottom: 0.25rem;
  }
}
</style>
