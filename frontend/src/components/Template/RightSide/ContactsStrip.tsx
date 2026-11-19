// AI-GENERATED — not an architecture reference
import { useApolloClient } from '@vue/apollo-composable'
import { BSpinner } from 'bootstrap-vue-next'
import { computed, defineComponent } from 'vue'
import { useI18n } from 'vue-i18n'
import { ContactsEmpty } from '@/components/Contacts/ContactsEmpty'
import { ContactTiles } from '@/components/Contacts/ContactTiles'
import { ContactWindow } from '@/components/Contacts/ContactWindow'
import { type Contact, contactDisplay } from '@/components/Contacts/contactDisplay'
import { contactsPanelState } from '@/composables/useContactsPanel'
import { useContactsPanelHost } from '@/composables/useContactsPanelHost'
import { useContactWindow } from '@/composables/useContactWindow'
import { isFavorite } from '@/composables/useFavorites'
import classes from './ContactsStrip.module.scss'

/**
 * The favourites over the send form on a phone (BAU-11).
 *
 * A shortcut into the field right beneath it: tap a face, the contact window opens, and
 * "Gradido senden" fills the form in. The full list has its own page behind the menu, and
 * the tile at the end of the row leads there.
 *
 * ⛔ Reads the unfiltered page, never the search result. The column's search box does not
 * exist here, so a strip fed by the search would show a filtered handful after a rotation,
 * with nothing on screen to say why or to clear it.
 */
export const ContactsStrip = defineComponent({
  name: 'ContactsStrip',
  setup() {
    const { t } = useI18n()
    const { client: apolloClient } = useApolloClient()
    const page = computed(() => contactsPanelState.page)

    /**
     * ⛔ Read through the composable, not the `favorite` flag the server sent with the row: a
     * heart given in the contact window has to move the person into this row at once, without
     * a refetch.
     */
    const hearted = computed<Contact[]>(() =>
      page.value.rows.filter((contact: Contact) => isFavorite(contact.user)),
    )
    // ⛔ No zoom bindings: the tile is itself a button, and a zoomable avatar renders one too.
    const favorites = computed(() => hearted.value.map((contact) => contactDisplay(contact)))

    const membersOnScreen = computed(() => hearted.value.map(({ user }) => user))

    useContactsPanelHost(apolloClient, membersOnScreen)

    const { windowOpen, selected, open } = useContactWindow()

    return () => (
      <div
        class={['contacts-strip page-text', classes['contacts-strip']]}
        data-test='contacts-strip'
      >
        <div class='contacts-strip-label'>{t('contacts.favorites')}</div>

        {!page.value.loaded ? (
          <div class='text-center py-2' data-test='contacts-strip-loading'>
            <BSpinner small />
          </div>
        ) : page.value.failed ? (
          // A failed request is not an empty list.
          <div class='small text-muted' data-test='contacts-strip-error'>
            {t('contacts.notReachable')}
          </div>
        ) : (
          // ⛔ Every state answered here, not by falling through. The strip used to be the
          // column minus its column-only parts, and a member with contacts but no favourites
          // therefore got a completely empty box over the send form -- with no route to the
          // full list either, because the tile lived inside the favourites branch. Each
          // posture declares its own four states now: loading, failed, empty, content.
          <>
            {!favorites.value.length ? (
              <div class='small text-muted mb-2' data-test='contacts-strip-empty'>
                {/* ⛔ Two different nothings, and only the first one gets the way out. A member
                    who HAS contacts but no hearts is not looking for somebody to show Gradido
                    to -- they are looking for the heart. */}
                {page.value.count === 0 ? <ContactsEmpty /> : t('contacts.noFavorites')}
              </div>
            ) : null}
            {/* The tiles stand even with nobody in them: the trailing tile is the only way from
                here to the full list. */}
            <ContactTiles rows={favorites.value} withAllLink onOpen={open} />
          </>
        )}

        <ContactWindow
          modelValue={windowOpen.value}
          contact={selected.value}
          onUpdate:modelValue={(value: boolean) => {
            windowOpen.value = value
          }}
        />
      </div>
    )
  },
})
