// AI-GENERATED — not an architecture reference
import { computed, defineComponent } from 'vue'
import { useI18n } from 'vue-i18n'
import { useRoute } from 'vue-router'
import CONFIG from '@/config'
import { useWalletStore } from '@/store/useWalletStore'
import classes from './breadcrumb.module.scss'

export const Breadcrumb = defineComponent({
  name: 'Breadcrumb',
  setup() {
    const { t } = useI18n()
    const route = useRoute()
    const store = useWalletStore()

    const pageTitle = computed(() => {
      // No key, no heading -- rather than the string "pageTitle.undefined", which is what
      // a missing meta used to print.
      if (!route.meta.pageTitle) {
        return ''
      }
      const options = { name: store.firstName, community: CONFIG.COMMUNITY_NAME }
      // eslint-disable-next-line @intlify/vue-i18n/no-dynamic-keys
      return t(`pageTitle.${route.meta.pageTitle}`, options)
    })

    /*
      ⛔ The BOX stays even with nothing in it, and that is not tidiness: below 450px the
      navigation bar is `position: fixed`, and this box's `margin-top: 3rem` is the only
      thing holding the page out from under it. Take the box away with the heading and the
      content slides underneath on exactly the device the space was being won for.

      A route that names no `pageTitle` shows no heading -- which is how a page asks for its
      own vertical space back. (Bernd, 22.08.2026: the phone needs the room.)
    */
    return () => (
      <div
        class={[
          'page-breadcrumb breadcrumb bg-transparent',
          classes['page-breadcrumb'],
          { 'is-untitled': !pageTitle.value },
        ]}
      >
        {pageTitle.value ? <h1 data-test='page-title'>{pageTitle.value}</h1> : null}
      </div>
    )
  },
})
