// AI-GENERATED — not an architecture reference

import typeSign from '@frontend/../public/img/svg/type.svg?raw'
import CONFIG from '@frontend/config'
import { avatarLettering } from '@frontend/utils/avatarLettering'
import m from 'mithril'
import { isPhone } from '@/browser/viewport'
import { MemberAvatar } from '@/components/member/MemberAvatar'
import { icon } from '@/components/ui/icon'
import { locale, t } from '@/i18n'
import { askProjectBranding, projectBranding } from '@/store/projectBranding'
import { session, sessionRuns } from '@/store/Session'
import { theme } from '@/store/Theme'
import facebook from '~icons/bi/facebook'
import telegram from '~icons/bi/telegram'
import twitterX from '~icons/bi/twitter-x'
import youtube from '~icons/bi/youtube'
import { AuthCarousel } from './AuthCarousel'
import footerClasses from './AuthFooter.module.css'
import classes from './AuthLayout.module.css'
import barClasses from './AuthNavbar.module.css'
import { authLink } from './authLink'
import { LanguageSwitch } from './LanguageSwitch'

// The drawing of the old wallet's file, in the bundle: one request less before the card is
// complete.
const TYPE_SIGN = typeSign.match(/ d="([^"]+)"/)?.[1]
if (!TYPE_SIGN) {
  throw new Error('type.svg has no path')
}

/**
 * The frame around every page for somebody not signed in: the bar with the logo and the two
 * ways in, the pictures on the desk, the greeting, the card with the language and the size
 * of its letters, the footer. It stays while the page inside it changes.
 */
export class AuthLayout implements m.ClassComponent {
  #textSizeRem?: number
  #sizesOpen = false
  #sizes?: Element

  oninit() {
    askProjectBranding(new URLSearchParams(location.search).get('project') ?? undefined)
  }

  onremove() {
    document.removeEventListener('click', this.#closeSizesBeside)
  }

  #closeSizes() {
    this.#sizesOpen = false
    document.removeEventListener('click', this.#closeSizesBeside)
  }

  // Escape closes the sizes, and the focus goes back to the button that opened them
  readonly #escapeSizes = (event: KeyboardEvent) => {
    if (event.key === 'Escape' && this.#sizesOpen) {
      this.#closeSizes()
      document.getElementById('popover-target-1')?.focus()
    }
  }

  // a listener on the document, outside of Mithril's handlers: it redraws itself
  readonly #closeSizesBeside = (event: MouseEvent) => {
    if (event.target instanceof Node && !this.#sizes?.contains(event.target)) {
      this.#closeSizes()
      m.redraw()
    }
  }

  // The logo leads home: to the start page of this community, loaded afresh like its address
  // typed -- and, with a session, to the overview, as the logo of the signed-in wallet.
  #home(signedIn: boolean, attrs: m.Attributes, children: m.Children) {
    return signedIn
      ? m(m.route.Link, { ...attrs, href: '/overview' }, children)
      : m('a', { ...attrs, href: `${CONFIG.COMMUNITY_URL.replace(/\/+$/, '')}/` }, children)
  }

  // One of the two ways in: named, not linked, on its own page.
  #wayIn(page: '/login' | '/register', text: string, place: string, query: Record<string, string>) {
    const shown = m.route.get().split(/[?#]/)[0]
    const active = shown === page || shown.startsWith(`${page}/`)
    return m(
      'li.nav-item.auth-navbar',
      { class: [barClasses.authNavbar, place, active ? 'active' : ''].join(' ') },
      active
        ? m('span.nav-link.active', { 'aria-current': 'page' }, text)
        : m(m.route.Link, { class: 'nav-link', href: authLink(page, query) }, text),
    )
  }

  #bar() {
    const { member } = session.state
    // The member alone is not enough: the device keeps them after a session ran out, and
    // the sign-in form would stand under their face.
    const signedIn = member !== null && sessionRuns()
    // dark mode has a light logo of its own
    const logo = theme.dark ? '/img/brand/gradido-logo-white.png' : '/img/brand/gradido-logo.png'
    // A guarantor code in a Gradido address (`/u/<name>?guarantor=`) names nobody by itself:
    // the name goes along, as the page's own button sends it.
    const { alias, guarantor, referrer } = m.route.param()
    const guarantorReferrer: Record<string, string> =
      typeof guarantor === 'string' && typeof alias === 'string'
        ? { referrer: typeof referrer === 'string' ? referrer : alias }
        : {}
    return m(
      '.auth-header.position-sticky.index10',
      { class: barClasses.authHeader },
      m(
        'nav.navbar.navbar-expand.d-flex',
        // not drawn for a phone, where it is hidden: the blob is not fetched
        isPhone()
          ? undefined
          : this.#home(
              signedIn,
              {
                class: `navbar-brand auth-home d-none d-lg-block ${barClasses.authHome}`,
                'data-test': 'auth-home',
              },
              [
                m('img.position-absolute.p-2', { src: logo, width: '200', alt: 'Gradido' }),
                // the blob the logo stands on says nothing
                m('img', {
                  src: '/img/template/gradido_background_header.png',
                  width: '230',
                  alt: '',
                }),
              ],
            ),
        // below the desk no picture stands beside the form: the logo needs no blob
        this.#home(
          signedIn,
          {
            class: `auth-home auth-home-small d-lg-none ${barClasses.authHome} ${barClasses.authHomeSmall}`,
            'data-test': 'auth-home-small',
          },
          m('img.auth-logo-small', {
            class: barClasses.authLogoSmall,
            src: logo,
            alt: 'Gradido',
            'data-test': 'auth-logo-small',
          }),
        ),
        m(
          '#nav-collapse.collapse.navbar-collapse',
          m(
            'ul.navbar-nav.auth-links.ms-auto.me-lg-4',
            { class: barClasses.authLinks },
            member && signedIn
              ? // The member instead of the two links: their circle and "To my account", one
                // link. The circle is hidden from a screen reader: the word says it.
                m(
                  'li.nav-item.auth-navbar.ms-lg-5',
                  {
                    class: `${barClasses.authNavbar} ${barClasses.toAccount}`,
                    'data-test': 'auth-to-account',
                  },
                  m(
                    m.route.Link,
                    { class: 'nav-link', href: '/overview' },
                    m(MemberAvatar, {
                      class: barClasses.toAccountFace,
                      size: 30,
                      src: member.avatar ? `data:image/jpeg;base64,${member.avatar}` : undefined,
                      // the letters of the user name, in the colour of the real initials
                      initials: avatarLettering(member).letters,
                      colorSeed: avatarLettering(member).colorSeed,
                      'aria-hidden': 'true',
                    }),
                    m('span', { class: barClasses.toAccountWord }, t('auth.toAccount')),
                  ),
                )
              : [
                  this.#wayIn('/register', t('signup'), 'ms-lg-5', guarantorReferrer),
                  this.#wayIn('/login', t('signin'), 'separator-start', guarantorReferrer),
                ],
          ),
        ),
      ),
    )
  }

  #greeting() {
    return m(
      '.row.auth-greeting.mt-3.mt-md-5.ps-4.ps-md-0',
      { class: classes.authGreeting },
      m(
        '.col-sm-12.col-md-9.col-lg-9',
        m('.mb--2', t('welcome')),
        m('.h1.mb-0', CONFIG.COMMUNITY_NAME),
        m('.mb-0', t('1000thanks')),
      ),
      m(
        '.col-3.text-end.d-none.d-sm-none.d-md-inline',
        m(
          'span.b-avatar.text-bg-secondary.rounded-circle',
          { style: { width: '6rem', height: '6rem' } },
          m('span.b-avatar-img', m('img', { src: '/img/brand/gradido_coin_128x128.png', alt: '' })),
        ),
      ),
    )
  }

  // Above its sign and centred on it; where it would reach out of the frame on the right (a
  // phone), moved in. To the device pixel, as the old wallet's library placed it: the two
  // wallets show one picture.
  #placeTextSizes({ dom }: m.VnodeDOM) {
    const sign = dom.previousElementSibling
    const frame = dom.closest('.auth-template')
    const arrow = dom.firstElementChild
    if (!(dom instanceof HTMLElement && dom.offsetParent && sign && frame)) {
      throw new Error('the popover of the text sizes is drawn outside of its card')
    }
    if (!(arrow instanceof HTMLElement)) {
      throw new Error('the popover of the text sizes has no arrow')
    }
    const { left: signLeft, top: signTop, width: signWidth } = sign.getBoundingClientRect()
    const { left: cardLeft, top: cardTop } = dom.offsetParent.getBoundingClientRect()
    const { width, height } = dom.getBoundingClientRect()
    const snap = (px: number) => Math.round(px * devicePixelRatio) / devicePixelRatio
    const signCentre = signLeft + signWidth / 2
    const left = Math.min(signCentre - width / 2, frame.getBoundingClientRect().right - width)
    // 8px above the sign: the arrow reaches a little over it
    const top = signTop - height - 8
    dom.style.transform = `translate(${snap(left - cardLeft)}px, ${snap(top - cardTop)}px)`
    // the arrow points at the middle of the sign, wherever the popover went
    arrow.style.left = `${dom.clientWidth / 2 - arrow.offsetWidth / 2 + signCentre - (left + width / 2)}px`
  }

  // The size of the letters in the card: three to choose from, above the sign they open by.
  #textSizes() {
    return [
      m(
        // a button as wide as the div it was: the popover's arrow points at its middle
        'button#popover-target-1.pointer.d-block.w-100.text-end.p-0.border-0.bg-transparent',
        {
          type: 'button',
          'aria-label': t('auth.textSize'),
          'aria-expanded': String(this.#sizesOpen),
          'aria-controls': this.#sizesOpen ? 'text-sizes' : undefined,
          onkeydown: this.#escapeSizes,
          onclick: () => {
            if (this.#sizesOpen) {
              this.#closeSizes()
            } else {
              this.#sizesOpen = true
              document.addEventListener('click', this.#closeSizesBeside)
            }
          },
        },
        // black, as the file drawn as a picture was; the dark mode inverts it (`.svg-type`)
        m(
          'svg.svg-type',
          {
            class: classes.svgType,
            width: '19',
            height: '19',
            viewBox: '0 0 16 16',
            fill: '#000',
            'aria-hidden': 'true',
          },
          m('path', { d: TYPE_SIGN }),
        ),
      ),
      this.#sizesOpen
        ? m(
            '#text-sizes.popover.b-popover.b-popover-dark.fade.show.login-size-controller.bs-popover-top',
            {
              role: 'group',
              'aria-label': t('auth.textSize'),
              onkeydown: this.#escapeSizes,
              style: { position: 'absolute', left: '0', top: '0' },
              oncreate: (popover: m.VnodeDOM) => this.#placeTextSizes(popover),
            },
            m('.popover-arrow', { style: { position: 'absolute' } }),
            m(
              '.overflow-auto',
              m(
                '.popover-body',
                m(
                  '.text-light',
                  (
                    [
                      [t('85'), 0.85],
                      [t('100'), 1],
                      [t('125'), 1.25],
                    ] as const
                  ).map(([percent, rem], index) =>
                    m(
                      'span',
                      { class: index ? 'separator-start ms-2 ps-2' : undefined },
                      m(
                        'button.pointer.p-0.border-0.bg-transparent.text-reset',
                        {
                          type: 'button',
                          'aria-pressed': String((this.#textSizeRem ?? 1) === rem),
                          onclick: () => {
                            this.#textSizeRem = rem
                          },
                        },
                        percent,
                      ),
                    ),
                  ),
                ),
              ),
            ),
          )
        : undefined,
    ]
  }

  #footer() {
    const social = (href: string, platform: string, sign: m.Children) =>
      // the sign carries no text: the link names where it leads
      m(
        'a',
        {
          href,
          target: '_blank',
          rel: 'noopener',
          'aria-label': t('footer.socialLink', { platform }),
        },
        sign,
      )
    const outside = (href: string, text: string) =>
      m('li.nav-item', m('a.nav-link', { href, target: '_blank', rel: 'noopener' }, text))
    return m(
      'footer.footer.pe-5.mb-5',
      { class: footerClasses.authFooter },
      m(
        '.row.mt-lg-7.mt-md-6.mt-4',
        m(
          '.col.col-12.col-md-12.col-lg-6',
          m(
            '.d-flex.justify-content-center.justify-content-md-center.justify-content-lg-start.ms-3',
            m(
              'ul.nav.nav-footer.justify-content-center.justify-content-lg-start',
              outside(`https://gradido.net/${locale}/impressum/`, t('footer.imprint')),
              outside(`https://gradido.net/${locale}/datenschutz/`, t('footer.privacy_policy')),
              // a page of this wallet, so it opens in place
              CONFIG.MATCHING_ACTIVE
                ? m(
                    'li.nav-item',
                    { 'data-test': 'footer-event-matching' },
                    m(
                      m.route.Link,
                      { class: 'nav-link', href: '/project-matching' },
                      t('footer.eventMatching'),
                    ),
                  )
                : undefined,
            ),
          ),
        ),
        m(
          '.col.col-12.col-md-12.col-lg-6.mt-4.mb-4.mt-lg-0.mb-lg-0',
          m(
            '.d-flex.align-items-center.ms-4.ms-md-3.ms-lg-0.text-lg-end.pt-1',
            `${t('followUs')} `,
            social(
              'https://www.facebook.com/groups/Gradido/',
              'Facebook',
              icon(facebook, { class: 'ms-3 me-3 c-grey' }),
            ),
            social('https://twitter.com/gradido', 'X', icon(twitterX, { class: 'me-3 c-grey' })),
            social(
              'https://www.youtube.com/c/GradidoNet',
              'YouTube',
              icon(youtube, { class: 'me-3 c-grey' }),
            ),
            social(
              'https://t.me/Gradido',
              'Telegram',
              icon(telegram, { width: '16', height: '16', class: 'c-grey' }),
            ),
          ),
        ),
      ),
    )
  }

  oncreate({ dom }: m.VnodeDOM) {
    this.#sizes = dom.querySelector('.auth-card .col-2') ?? undefined
  }

  view({ children }: m.Vnode) {
    const { banner, asking } = projectBranding
    return m(
      '.auth-template',
      { class: classes.authTemplate },
      m(
        '.h-100.align-middle',
        this.#bar(),
        m(
          '.left-content-box.position-fixed.d-none.d-lg-block',
          { class: classes.leftContentBox },
          // not drawn for a phone, where the column is hidden: its pictures are not fetched
          isPhone()
            ? undefined
            : m(
                '.bg-img-box.position-absolute.w-100',
                { class: classes.bgImgBox },
                m(AuthCarousel),
              ),
          m(
            '.bg-txt-box.position-relative.d-none.d-lg-block.text-center.align-self-center',
            { class: classes.bgTxtBox },
            m(
              'a.btn.btn-gradido',
              {
                href: `https://gradido.net/${locale}`,
                target: '_blank',
                rel: 'noopener',
                // the shadow of the box's words is not the button's
                style: { textShadow: 'none' },
              },
              t('auth.left.learnMore'),
            ),
          ),
        ),
        m(
          '.row.justify-content-md-center.justify-content-lg-end',
          m(
            '.col-sm-12.col-md-8.col-lg-6.zindex1000',
            // no margin of its own below md: the card stands on the page edge like every box
            m(
              '.mx-0.mx-md-4',
              // a project's banner in the greeting's place; nothing while it is asked for,
              // so that the greeting does not show and go
              banner || asking
                ? m(
                    '.row.d-none.d-md-block',
                    m(
                      '.col',
                      banner
                        ? m('img.img-fluid.rounded-like-card', {
                            src: banner,
                            alt: 'project banner',
                          })
                        : undefined,
                    ),
                  )
                : this.#greeting(),
              m(
                '.card.auth-card.border-0.gradido-custom-background.page-font-size',
                {
                  class: `${classes.authCard} ${classes.pageFontSize}`,
                  style: this.#textSizeRem ? { fontSize: `${this.#textSizeRem}rem` } : undefined,
                },
                m(
                  '.row.p-4',
                  m('.col-10', m(LanguageSwitch, { class: 'ms-3' })),
                  m('.col-2.text-end', this.#textSizes()),
                ),
                // on a phone the greeting is not shown, and the banner stands in the card
                banner
                  ? m(
                      '.row.d-md-none.mb-3',
                      m(
                        '.col.text-center',
                        m('img.img-fluid.ms-1.me-1.col-10.col-sm-10.rounded-20', {
                          src: banner,
                          alt: 'project banner',
                        }),
                      ),
                    )
                  : undefined,
                m('.card-body', { class: classes.cardBody }, children),
              ),
            ),
            this.#footer(),
          ),
        ),
      ),
    )
  }
}
