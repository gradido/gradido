// AI-GENERATED — not an architecture reference
import m from 'mithril'
import type { Result } from 'shared/browser'
import { BusyButton } from '@/components/ui/BusyButton'
import { Message } from '@/components/ui/Message'
import { t } from '@/i18n'

type Attrs = {
  /** the class of the block, and of the button's `data-test` (`<name>-action`) */
  name: string
  title: string
  text: string
  button: string
  /** What the button asks of the server. */
  act: () => Promise<Result<unknown>>
  /** said where the server did it */
  done: string
  /** What to say where the server refused with `message`. */
  refused: (message: string) => string
}

/**
 * A page a link of a mail opens: it says what the link is for, and does it on a click only --
 * a mail scanner that opens every link changes nothing. Then it says what came of it, and
 * leads to the sign-in.
 */
export class MailLinkAction implements m.ClassComponent<Attrs> {
  #answer?: Result<unknown>

  view({ attrs: { name, title, text, button, act, done, refused } }: m.Vnode<Attrs>) {
    if (this.#answer) {
      return m(Message, {
        headline: this.#answer.success ? t('message.title') : t('message.errorTitle'),
        subtitle: this.#answer.success ? done : refused(this.#answer.error.message),
        buttonText: t('login'),
        linkTo: '/login',
      })
    }
    return m(
      'div',
      { class: name },
      m('.h3.pb-3', title),
      m('p.pb-4', text),
      m(
        BusyButton,
        {
          class: 'btn-gradido',
          'data-test': `${name}-action`,
          onclick: async () => {
            this.#answer = await act()
          },
        },
        button,
      ),
    )
  }
}
