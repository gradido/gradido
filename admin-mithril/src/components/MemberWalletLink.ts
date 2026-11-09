// AI-GENERATED — not an architecture reference
import classes from '@admin/components/MemberWalletLink.module.css'
import { CONFIG } from '@admin/config'
import { verifyLogin } from '@admin/graphql/verifyLogin'
import { handOverAddress } from '@admin/utils/authToken'
import { dropMapWindowName, MAP_WINDOW_NAME } from '@admin/utils/mapWindow'
import m, { type ClassComponent, type Vnode } from 'mithril'
import { toastWarning } from '@/components/Toasts'
import { isTheModerator, type MemberRef, moderatorKey } from '@/data/Member.logic'
import { graphqlRequest } from '@/graphql/client'
import { t } from '@/i18n'
import { adminStore } from '@/store/admin.store'
import {
  askModeratorContacts,
  moderatorContact,
  RETURN_FRESH_MS,
} from '@/store/moderatorContacts.store'
import mapPinIcon from '~icons/bi/geo-alt-fill'
import sendIcon from '~icons/bi/send'
import chatIcon from '~icons/mdi/chat-outline'

type Member = MemberRef & { findableOnMap?: boolean | null; deletedAt?: string | Date | null }

interface Attrs {
  member: Member
  /** how the row speaks of them, for the labels */
  name: string
}

// just below the width at which the wallet sets its menu beside the page: the map takes it all
const WINDOW_FEATURES = 'popup,width=1000,height=760'

const pair = ({ gradidoID, communityUuid }: Member) =>
  `with=${encodeURIComponent(String(gradidoID))}&community=${encodeURIComponent(String(communityUuid))}`

// The three ways into the wallet: the map on the member, the conversation with a contact, and
// the send form to them on its tab "E-Mail senden", scrolled to the form.
const FACES = {
  map: {
    test: 'member-map-pin',
    label: 'goTo.memberMap',
    svg: mapPinIcon,
    page: (member: Member) => `/matching/karte?${pair(member)}`,
  },
  chat: {
    test: 'member-chat-bubble',
    label: 'goTo.memberChat',
    svg: chatIcon,
    page: (member: Member) => `/contacts?${pair(member)}`,
  },
  send: {
    test: 'member-send-arrow',
    label: 'goTo.memberSend',
    svg: sendIcon,
    page: ({ gradidoID, communityUuid }: Member) =>
      `/send/${encodeURIComponent(String(communityUuid))}/${encodeURIComponent(String(gradidoID))}?art=email#send-form`,
  },
}

/**
 * The page of the wallet with the page of the admin it was opened from (`admin=/user`), its way
 * back -- before the anchor, where a query belongs, and without this page's query: a search of
 * an entry link would win on the way back over the one typed since.
 */
const withWayBack = (page: string) => {
  const here = window.location.pathname.replace(/^\/admin(?=\/)/, '')
  const [path, anchor] = page.split('#')
  const back = `admin=${encodeURIComponent(here)}`
  return `${path}${path.includes('?') ? '&' : '?'}${back}${anchor === undefined ? '' : `#${anchor}`}`
}

/**
 * The wallet in a window of its own beside the admin, signed in as this moderator. One window,
 * named, for every member. The press asks the server once (verifyLogin), so that it counts as a
 * step of work: the sign-in lasts ten minutes from the last answer, and the window is handed the
 * token of the press.
 */
const openInWallet = (page: string) => {
  const address = `${handOverAddress(CONFIG.WALLET_AUTH_URL, adminStore.token)}&redirect=${encodeURIComponent(withWayBack(page))}`
  // never this window itself, which may carry the name (mapWindow.ts)
  dropMapWindowName()
  const opened = window.open(address, MAP_WINDOW_NAME, WINDOW_FEATURES)
  if (opened) {
    opened.focus()
  } else {
    toastWarning(t('goTo.memberMapBlocked'))
  }
  graphqlRequest(verifyLogin)
}

/**
 * What stands behind a member's name to reach them in the wallet: the pin of a member on the map,
 * and the bubble into the conversation with a contact or the arrow into the send form for
 * everybody else. Neither for a deleted member nor for the moderator themselves.
 */
export class MemberWalletLink implements ClassComponent<Attrs> {
  // whom the last question was asked for, so that a row showing somebody else asks again
  private askedFor: string | null = null

  private readonly askAgainOnReturn = () => {
    if (document.visibilityState !== 'hidden' && this.askedFor !== null) {
      askModeratorContacts(moderatorKey(adminStore.moderator), RETURN_FRESH_MS)
    }
  }

  oncreate() {
    window.addEventListener('focus', this.askAgainOnReturn)
    document.addEventListener('visibilitychange', this.askAgainOnReturn)
  }

  onremove() {
    window.removeEventListener('focus', this.askAgainOnReturn)
    document.removeEventListener('visibilitychange', this.askAgainOnReturn)
  }

  view({ attrs: { member, name } }: Vnode<Attrs>) {
    const owner = moderatorKey(adminStore.moderator)
    const canBeWrittenTo =
      !member.deletedAt &&
      Boolean(member.gradidoID && member.communityUuid) &&
      !isTheModerator(adminStore.moderator, member)
    const askFor = canBeWrittenTo ? `${member.communityUuid}/${member.gradidoID}` : null
    if (askFor !== null && askFor !== this.askedFor) {
      askModeratorContacts(owner)
    }
    this.askedFor = askFor
    const contact = canBeWrittenTo ? moderatorContact(owner, member) : null
    const face = contact === null ? null : contact === 'yes' ? FACES.chat : FACES.send
    const button = (shown: typeof FACES.map) => {
      const label = t(shown.label, { name })
      return m(
        'button',
        {
          type: 'button',
          class: classes.memberWalletLink,
          'data-test': shown.test,
          title: label,
          'aria-label': label,
          onclick: () => openInWallet(shown.page(member)),
        },
        m.trust(shown.svg.replace('<svg ', '<svg aria-hidden="true" ')),
      )
    }
    // one line for both: a narrow cell breaks ahead of the pin, never behind it
    return m('span', { class: classes.memberWalletLinks }, [
      member.findableOnMap === true ? button(FACES.map) : null,
      // while the server is asked, the room of the bubble or the arrow, for three seconds at most
      contact === 'asking'
        ? m('span', {
            class: classes.memberWalletLink,
            'data-test': 'member-wallet-link-wait',
            'aria-hidden': 'true',
          })
        : face
          ? button(face)
          : null,
    ])
  }
}
