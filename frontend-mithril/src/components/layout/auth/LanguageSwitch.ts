// AI-GENERATED — not an architecture reference

import m from 'mithril'
import { Dropdown } from '@/components/ui/Dropdown'
import { icon } from '@/components/ui/icon'
import { toastError, toastSuccess } from '@/components/ui/Toasts'
import { updateLanguageSchema } from '@/data/Account.schema'
import { updateLanguage } from '@/graphql/account'
import { request } from '@/graphql/client'
import { LANGUAGES, type Language, locale, setLocale, t } from '@/i18n'
import { session, sessionRuns } from '@/store/Session'
import caretDown from '~icons/bi/caret-down-fill'
import check from '~icons/bi/check'
import globe from '~icons/bi/globe2'
import classes from './LanguageSwitch.module.css'

/**
 * The language shown, and the menu to choose another from (`Dropdown`, with the keyboard of a
 * menu button). A choice is kept on this device; with a member signed in it is saved to the
 * account as well, without one the next sign-in saves it (`preLoginLanguage`).
 */
export class LanguageSwitch implements m.ClassComponent<{ class?: string }> {
  async #choose(language: Language) {
    // Asked for even where it is shown: it takes the place of a choice still on its way.
    const shown = locale
    if (!(await setLocale(language))) {
      // another choice came after this one, and is the one kept
      return
    }
    // the texts came after the click's redraw
    m.redraw()
    if (language === shown) {
      return
    }
    const signedIn = session.state.member !== null && sessionRuns()
    session.set({
      ...session.state,
      language,
      preLoginLanguage: signedIn ? session.state.preLoginLanguage : language,
    })
    if (signedIn) {
      const saved = await request(updateLanguage, { locale: language }, updateLanguageSchema)
      if (saved.success) {
        toastSuccess(t('settings.language.success'))
      } else {
        toastError(t('settings.language.error'))
      }
    }
  }

  view({ attrs }: m.Vnode<{ class?: string }>) {
    // the language shown first, the others by their own names
    const languages = (Object.keys(LANGUAGES) as Language[]).sort((a, b) =>
      a === locale ? -1 : b === locale ? 1 : LANGUAGES[a].name.localeCompare(LANGUAGES[b].name),
    )
    return m(
      Dropdown,
      {
        class: ['language-switch', classes.languageSwitch, attrs.class].join(' '),
        buttonClass: `ls-trigger ${classes.lsTrigger}`,
        menuClass: `ls-menu ${classes.lsMenu}`,
        buttonContent: [
          icon(globe, { class: `ls-globe ${classes.lsGlobe}` }),
          m('span.ls-current', { class: classes.lsCurrent }, LANGUAGES[locale].name),
          icon(caretDown, { class: `ls-caret ${classes.lsCaret}` }),
        ],
      },
      languages.map((language) =>
        m(
          'li',
          { role: 'none' },
          m(
            'button.ls-item',
            {
              type: 'button',
              role: 'menuitemradio',
              tabindex: -1,
              // read in its own language
              lang: language,
              class: [
                classes.lsItem,
                language === locale ? `ls-item-active ${classes.lsItemActive}` : '',
              ].join(' '),
              'aria-checked': String(language === locale),
              onclick: () => this.#choose(language),
            },
            m('span.ls-item-name', LANGUAGES[language].name),
            language === locale ? icon(check, { class: `ls-check ${classes.lsCheck}` }) : undefined,
          ),
        ),
      ),
    )
  }
}
