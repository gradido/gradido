// AI-GENERATED — not an architecture reference
import './App.css'
import m from 'mithril'
import { AuthLayout } from '@/components/layout/auth/AuthLayout'
import { theme } from '@/store/Theme'

type Attrs = {
  /** The page is for members: it stands in the wallet's frame, every other in the sign-in's. */
  requiresAuth: boolean
}

/**
 * What stands around every page: the element the styles are written for -- an `#app` inside
 * the `#app` of index.html, which says `dark-mode` as `body` does --, the frame of the page,
 * and the golden edge at the bottom.
 */
export class App implements m.ClassComponent<Attrs> {
  view({ attrs: { requiresAuth }, children }: m.Vnode<Attrs>) {
    return m(
      '#app',
      { class: theme.dark ? 'dark-mode' : undefined },
      m(
        'div',
        { class: requiresAuth ? 'app-content' : undefined },
        // the frame of the pages for members comes with the first of them (todo.md)
        requiresAuth ? children : m(AuthLayout, children),
        m('.goldrand.position-fixed.fixed-bottom.zindex1000'),
      ),
    )
  }
}
