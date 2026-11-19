// AI-GENERATED — not an architecture reference
import { useApolloClient } from '@vue/apollo-composable'
import { BFormInput, BSpinner } from 'bootstrap-vue-next'
import { computed, defineComponent, onUnmounted, ref, watch } from 'vue'
import { useI18n } from 'vue-i18n'
import { RouterLink } from 'vue-router'
import { AppAvatar } from '@/components/AppAvatar'
import { ChatUnreadDot } from '@/components/Chat/ChatUnreadDot'
import { ContactsEmpty } from '@/components/Contacts/ContactsEmpty'
import { ContactTiles } from '@/components/Contacts/ContactTiles'
import { ContactWindow } from '@/components/Contacts/ContactWindow'
import { type Contact, contactDisplay } from '@/components/Contacts/contactDisplay'
import { FavoriteHeart } from '@/components/FavoriteHeart'
import { Name } from '@/components/TransactionRows/Name'
import { contactsPanelState, searchContactsPanel } from '@/composables/useContactsPanel'
import { useContactsPanelHost } from '@/composables/useContactsPanelHost'
import { useContactWindow } from '@/composables/useContactWindow'
import { isFavorite } from '@/composables/useFavorites'
import { CONTACTS_PANEL_ROWS, LIST_AVATAR_SIZE } from '@/constants'
import classes from './ContactsPanel.module.scss'

/**
 * The contacts beside the page, on the three routes that carry a switchable column
 * (BAU-10a, KF-009).
 *
 * The phone's posture is a component of its own (`ContactsStrip`), because they were one
 * component with a `variant` prop and the strip was defined by subtraction -- so a state
 * this column handles had no counterpart there. What the two still share they share through
 * `useContactsPanelHost` and `useContactWindow` rather than by copy.
 */
export const ContactsPanel = defineComponent({
  name: 'ContactsPanel',
  setup() {
    const { t, d } = useI18n()
    const { client: apolloClient } = useApolloClient()

    const searching = computed(() => contactsPanelState.search !== '')
    /** Which of the module's two slots this column is showing: the page, or the matches. */
    const shownSlot = computed(() =>
      searching.value ? contactsPanelState.matches : contactsPanelState.page,
    )
    const rows = computed<Contact[]>(() => shownSlot.value.rows)

    const searchInput = ref(contactsPanelState.search)

    /**
     * Debounced, so a query does not go out on every keystroke -- the pattern the contribution
     * lists use, at their interval.
     *
     * ⛔ Cleared on unmount. A flick of the switch above throws this column away, and a timer
     * that outlived it would search for a word nobody can see any more.
     */
    let searchTimer: ReturnType<typeof setTimeout> | undefined
    watch(searchInput, (value) => {
      clearTimeout(searchTimer)
      searchTimer = setTimeout(() => {
        searchContactsPanel(apolloClient, value)
      }, 400)
    })
    onUnmounted(() => {
      clearTimeout(searchTimer)
    })

    /** The contacts with a heart -- none while a word is being searched. */
    const hearted = computed<Contact[]>(() =>
      searching.value ? [] : rows.value.filter((contact) => isFavorite(contact.user)),
    )

    /** What stands under the heading: the newest non-favourites, or the matches. */
    const shownRows = computed(() =>
      (searching.value
        ? rows.value
        : rows.value.filter((contact) => !isFavorite(contact.user))
      ).slice(0, CONTACTS_PANEL_ROWS),
    )

    /**
     * ⛔ The tiles get a face WITHOUT the zoom bindings, the list rows get one with them, and
     * the difference is structural rather than a preference. A zoomable avatar renders its own
     * button and stops the click, so inside the tile -- which is itself a button -- it
     * swallowed the tap meant for the contact window, and only for members who had a portrait.
     * In the list the avatar stands outside the button, so it can open the picture without
     * taking anything away.
     */
    const favorites = computed(() => hearted.value.map((contact) => contactDisplay(contact)))
    const listed = computed(() =>
      shownRows.value.map((contact) => contactDisplay(contact, { zoomable: true })),
    )

    /**
     * The members this column is drawing, in drawing order: the tiles stand above the list.
     *
     * ⛔ Built from the rows and the hearts, and from NOTHING that reads the avatar store --
     * see the note in `useContactsPanelHost`. `contactDisplay` reads that store, so the
     * decorated lists above must not be the watch source.
     */
    const membersOnScreen = computed(() =>
      [...hearted.value, ...shownRows.value].map(({ user }) => user),
    )

    useContactsPanelHost(apolloClient, membersOnScreen)

    /**
     * `contacts.all` plus the number and an arrow, as ONE string: the brackets and the arrow
     * are punctuation, and loose in the template they are raw text the i18n lint reports.
     *
     * ⛔ A number only where there is one to state. The server's `count` is the number of
     * MATCHES while a word is being searched -- a member with 137 contacts who typed "an" was
     * shown a count of 2 over a link that leads to all 137 -- and it is 0 before the first
     * answer arrives, which would say something false about a list nobody has read yet.
     */
    const allContactsLabel = computed(() => {
      const page = contactsPanelState.page
      const known = !searching.value && page.loaded && !page.failed
      return known ? `${t('contacts.all')} (${page.count}) →` : `${t('contacts.all')} →`
    })

    const { windowOpen, selected, open } = useContactWindow()

    return () => (
      <div class={['contacts-panel', classes['contacts-panel']]} data-test='contacts-panel'>
        {/* ⛔ The column's name, for a screen reader only. The switch above carries it on
            screen, but a group of pressed buttons is not a heading: the "next heading" jump
            has nothing to land on, so the column had no title to navigate to.

            ⚠️ It is not a heading that was lost here -- the markup this replaced was
            `<BCol class="h3">`, and `h3` is a Bootstrap STYLING class on a div
            (`tag: { default: 'div' }`), so the jump never found it either. This adds what was
            never there, rather than restoring something. (coderabbit, PR #3837.)

            ⚠️ `visually-hidden` is Bootstrap's own and ships in the stylesheet (verified in
            the built CSS); it clips the element instead of hiding it, so the text stays
            readable to assistive technology. `d-none` would take it away from that too. */}
        <h2 class='visually-hidden'>{t('rightSide.contacts')}</h2>

        <BFormInput
          modelValue={searchInput.value}
          type='search'
          size='sm'
          placeholder={t('contacts.search')}
          class='mb-3'
          data-test='contacts-panel-search'
          onUpdate:modelValue={(typed) => {
            searchInput.value = typed as string
          }}
        />

        {!shownSlot.value.loaded ? (
          <div class='text-center py-3' data-test='contacts-panel-loading'>
            <BSpinner small />
          </div>
        ) : shownSlot.value.failed ? (
          // A failed request is not an empty list: "no contacts yet" would tell a member with a
          // hundred of them that they have none.
          <div class='small text-muted' data-test='contacts-panel-error'>
            {t('contacts.notReachable')}
          </div>
        ) : searching.value && !rows.value.length ? (
          // ⛔ Two different nothings, and the column says which. Searching is done on the
          // SERVER here (twenty rows would be the wrong set to search), so an unmatched word
          // comes back as an empty page and used to be reported as "you have no contacts yet".
          <div class='small text-muted' data-test='contacts-panel-no-match'>
            {t('contacts.count', 0)}
          </div>
        ) : !rows.value.length ? (
          <div class='small text-muted' data-test='contacts-panel-empty'>
            <ContactsEmpty />
          </div>
        ) : (
          <>
            {/* Favourites first, then the newest, with the search box above both (L §8.14).
                While a word is being searched there is one flat list of matches instead: the
                question then is "where is this person", not "who is near me". */}
            {favorites.value.length ? (
              <div data-test='contacts-panel-favorites'>
                <div class='contacts-panel-label'>{t('contacts.favorites')}</div>
                <ContactTiles rows={favorites.value} onOpen={open} />
              </div>
            ) : null}

            {listed.value.length ? (
              <div
                style={{ '--contacts-panel-face': `${LIST_AVATAR_SIZE}px` }}
                data-test='contacts-panel-recent'
              >
                <div class='contacts-panel-label'>
                  {searching.value ? t('contacts.matches') : t('contacts.recent')}
                </div>
                {/* ⛔ The avatar and the heart stand OUTSIDE the button, exactly as ContactRow has
                    them. A zoomable avatar renders its own button and stops the click, and the
                    heart renders one too: nested inside the row button they made the row's
                    accessible name the sum of three controls, and the face swallowed the tap that
                    was meant to open the window -- but only for members who had a portrait. */}
                {listed.value.map((row) => (
                  <div
                    key={row.key}
                    class='contacts-panel-row'
                    data-test={`contacts-panel-row-${row.contact.user.gradidoID}`}
                  >
                    {/* The size every list of people in the wallet uses, the bookings in the other
                        position of the switch above included. */}
                    <AppAvatar size={LIST_AVATAR_SIZE} color='#fff' {...row.avatar} />
                    <button
                      type='button'
                      class='contacts-panel-open'
                      data-test={`contacts-panel-open-${row.contact.user.gradidoID}`}
                      onClick={() => open(row.contact)}
                    >
                      <span class='contacts-panel-who'>
                        <span class='contacts-panel-who-name'>
                          <Name
                            linkedUser={row.contact.user}
                            withCommunity={false}
                            opens={false}
                            fontColor='text-dark'
                          />
                        </span>
                        {row.contact.user.communityName ? (
                          <span class='contacts-panel-who-community'>
                            {row.contact.user.communityName}
                          </span>
                        ) : null}
                      </span>
                      <span class='contacts-panel-date'>
                        {d(new Date(row.contact.lastAt), 'short')}
                      </span>
                      {/* Drawn on the face's upper corner, as on the tiles above -- Bernd's choice
                          (25.09.2026) over the place after the date, which took 17px from a name the
                          column already cuts. Standing last in the button, so the row's name says it. */}
                      <ChatUnreadDot
                        count={row.contact.unreadChatMessages}
                        class='contacts-panel-dot'
                      />
                    </button>
                    <FavoriteHeart member={row.contact.user} />
                  </div>
                ))}
              </div>
            ) : null}
          </>
        )}

        {/* ⛔ OUTSIDE every state, because it is the way out of all of them. It used to sit in
            the content branch, so the loading, failed, empty and no-match states offered no
            route to the full list at all -- which is the very defect the phone strip was
            carved out to fix, left standing in the column beside it. */}
        <RouterLink to='/contacts' class='contacts-panel-alllink' data-test='contacts-panel-count'>
          {allContactsLabel.value}
        </RouterLink>

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
