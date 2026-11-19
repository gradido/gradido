// AI-GENERATED — not an architecture reference
import m, { type ClassComponent, type Vnode } from 'mithril'
import { ContentFooter } from './ContentFooter'
import { MemberAvatarZoom } from './MemberAvatarZoom'
import { NavBar } from './NavBar'
import { Toasts } from './Toasts'

/** The frame of every page once signed in. */
export class Layout implements ClassComponent {
  view({ children }: Vnode) {
    return m('div', [
      m(Toasts),
      m(NavBar),
      m('.wrapper.p-3', children),
      m(ContentFooter),
      // one window for every face, while somebody is signed in
      m(MemberAvatarZoom),
    ])
  }
}
