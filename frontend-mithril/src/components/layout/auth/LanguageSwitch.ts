// AI-GENERATED — not an architecture reference

import m from 'mithril'
import * as v from 'valibot'
import { icon } from '@/components/ui/icon'
import { toastError, toastSuccess } from '@/components/ui/Toasts'
import { updateLanguage } from '@/graphql/account'
import { request } from '@/graphql/client'
import { LANGUAGES, type Language, locale, setLocale, t } from '@/i18n'
import { session, sessionRuns } from '@/store/Session'
import caretDown from '~icons/bi/caret-down-fill'
import check from '~icons/bi/check'
import globe from '~icons/bi/globe2'
import classes from './LanguageSwitch.module.css'

/**
 * The language shown, and the list to choose another from. A choice is kept on this device;
 * with a member signed in it is saved to the account as well, without one the next sign-in
 * saves it (`preLoginLanguage`). Every attribute goes to the block (`class`).
 */
export class LanguageSwitch implements m.ClassComponent<m.Attributes> {
  #open = false
  #dom?: Element

  oncreate({ dom }: m.VnodeDOM<m.Attributes>) {
    this.#dom = dom
  }

  onremove() {
    document.removeEventListener('click', this.#closeBeside)
  }

  #close() {
    this.#open = false
    document.removeEventListener('click', this.#closeBeside)
  }

  // a listener on the document, outside of Mithril's handlers: it redraws itself
  readonly #closeBeside = (event: MouseEvent) => {
    if (event.target instanceof Node && !this.#dom?.contains(event.target)) {
      this.#close()
      m.redraw()
    }
  }

  async #choose(language: Language) {
    this.#close()
    if (language === locale) {
      return
    }
    await setLocale(language)
    const signedIn = session.state.member !== null && sessionRuns()
    session.set({
      ...session.state,
      language,
      preLoginLanguage: signedIn ? session.state.preLoginLanguage : language,
    })
    if (signedIn) {
      const saved = await request(updateLanguage, { locale: language }, v.unknown())
      if (saved.success) {
        toastSuccess(t('settings.language.success'))
      } else {
        toastError(t('settings.language.error'))
      }
    }
  }

  view({ attrs }: m.Vnode<m.Attributes>) {
    // the language shown first, the others by their own names
    const languages = (Object.keys(LANGUAGES) as Language[]).sort((a, b) =>
      a === locale ? -1 : b === locale ? 1 : LANGUAGES[a].name.localeCompare(LANGUAGES[b].name),
    )
    return m(
      '.language-switch',
      { ...attrs, class: [classes.languageSwitch, attrs.class].join(' ') },
      m(
        'button.ls-trigger',
        {
          type: 'button',
          class: classes.lsTrigger,
          'aria-expanded': String(this.#open),
          'aria-haspopup': 'listbox',
          onclick: () => {
            if (this.#open) {
              this.#close()
            } else {
              this.#open = true
              document.addEventListener('click', this.#closeBeside)
            }
          },
        },
        icon(globe, { class: `ls-globe ${classes.lsGlobe}` }),
        m('span.ls-current', { class: classes.lsCurrent }, LANGUAGES[locale].name),
        icon(caretDown, { class: `ls-caret ${classes.lsCaret}` }),
      ),
      this.#open
        ? m(
            'ul.ls-menu',
            { class: classes.lsMenu, role: 'listbox' },
            languages.map((language) =>
              m(
                'li.ls-item',
                {
                  class: [
                    classes.lsItem,
                    language === locale ? `ls-item-active ${classes.lsItemActive}` : '',
                  ].join(' '),
                  role: 'option',
                  'aria-selected': String(language === locale),
                  onclick: () => this.#choose(language),
                },
                m('span.ls-item-name', LANGUAGES[language].name),
                language === locale
                  ? icon(check, { class: `ls-check ${classes.lsCheck}` })
                  : undefined,
              ),
            ),
          )
        : undefined,
    )
  }
}
