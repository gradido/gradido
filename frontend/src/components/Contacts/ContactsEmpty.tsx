// AI-GENERATED — not an architecture reference
/**
 * What stands where a member has no contacts yet: one sentence, and one way out of it.
 *
 * ⛔ One component for all three places that show it -- the column, the phone strip and the
 * contacts page. They read one translation key today, and the three would have drifted the
 * moment the link was written into each of them by hand.
 */
import { defineComponent } from 'vue'
import { useI18n } from 'vue-i18n'
import { RouterLink } from 'vue-router'
import classes from './ContactsEmpty.module.scss'

export const ContactsEmpty = defineComponent({
  name: 'ContactsEmpty',
  props: {
    /**
     * Whether the way out is offered.
     *
     * False where the list is empty for a reason this link does not answer -- the contacts
     * page shows the same sentence while a SEARCH has found nobody, and "show it to your
     * friends" is no reply to that.
     */
    withLink: { type: Boolean, default: true },
  },
  setup(props) {
    const { t } = useI18n()

    return () => (
      <div class='contacts-empty'>
        <div data-test='contacts-empty-text'>{t('contacts.empty')}</div>
        {/* ⛔ ONE quiet link, and only while the list is empty. The way to get a contact is to
            show somebody Gradido, so this is the one place where saying so is an answer rather
            than an ask -- and it disappears the moment there is anybody in the list (ZE-007,
            KF-016 A3). No new key for it: the page it leads to already has its name. */}
        {props.withLink ? (
          <RouterLink
            to='/show-friends'
            class={['contacts-empty-link', classes['contacts-empty-link']]}
            data-test='contacts-empty-link'
          >
            {t('pageTitle.show-friends')}
          </RouterLink>
        ) : null}
      </div>
    )
  },
})
