// AI-GENERATED — not an architecture reference
import { BCollapse, BImg, BLink, BNavbar, BNavbarBrand, BNavbarNav } from 'bootstrap-vue-next'
import { computed, type DefineComponent, defineComponent } from 'vue'
import { useI18n } from 'vue-i18n'
import { useRoute } from 'vue-router'
import AppAvatarVue from '@/components/AppAvatar.vue'
import { NavItem } from '@/components/Menu/NavItem'
import { useAuthLinks } from '@/composables/useAuthLinks'
import CONFIG from '@/config'
import { useWalletStore } from '@/store/useWalletStore'
import { avatarLettering } from '@/utils/avatarLettering'
import { memberAlias } from '@/utils/gradidoAddress'
import classes from './AuthNavbar.module.scss'

/**
 * The circle of every member in the wallet. It is a .vue file, which TypeScript knows only as a
 * component without props (env.d.ts); these are the props this bar hands it, typed as
 * AppAvatar.vue declares them.
 */
const AppAvatar = AppAvatarVue as DefineComponent<{
  size?: number
  src?: string
  name?: string
  initials?: string
  colorSeed?: string | null
  color?: string
}>

export const AuthNavbar = defineComponent({
  name: 'AuthNavbar',
  setup() {
    const { t } = useI18n()
    const { routeWithParamsAndQuery } = useAuthLinks()
    // The JSDoc of useAuthLinks names `params` as well; they are optional, the route's own go
    // along without them.
    type LinkOptions = Parameters<typeof routeWithParamsAndQuery>[1]
    const route = useRoute()
    const store = useWalletStore()

    /**
     * The guarantor code (E-017) names the member who showed it by itself; the registration page
     * still shows their name above the form, and takes it from `referrer`. This bar stands above
     * the address page (`/u/:alias`) too and knows nothing of it, so its two links have to take
     * the name from the address along with the code - straight to the registration, or on the
     * detour over the sign-in. The page's own button names the referrer itself. Without a
     * guarantor code nothing changes, and a referrer already in the query stays the one it is.
     */
    const guarantorCodeReferrer = () =>
      route.query.guarantor && route.params.alias
        ? { referrer: route.query.referrer ?? route.params.alias }
        : {}

    /**
     * Whether a member is signed in on this browser: one rule for the whole bar, the logo and
     * the links. The pages under this bar (`/redeem/…`, `/u/…`, `/dk/…`, `/project`) are the same
     * for everybody (PS-011); the bar is not -- with a session it shows the member instead of
     * "Register | Sign in" (ZE-038, L1a; Bernd, 06.11.2026: back at a link after signing in,
     * nothing on the page said that he was signed in).
     *
     * The member the store holds, not `sessionRuns`: nothing redraws this bar when a session runs
     * out, and the logo has asked this since 14.10.2026. Where the session has run out, "To my
     * account" leads where the logo leads, to the overview, whose guard signs out and shows the
     * sign-in.
     */
    const signedIn = computed(() => Boolean(store.gradidoID))

    /**
     * Where the logo leads. Signed out: the start page of this community, its own address
     * (`COMMUNITY_URL`), loaded afresh like the address typed -- on every server today the wallet,
     * which begins at the sign-in, and a community whose address is a homepage of its own gets
     * that. With a session: the overview, as the logo of the signed-in wallet (Navbar.vue).
     * Nothing of the page's address goes along.
     */
    const home = computed(() =>
      signedIn.value
        ? { to: '/overview' }
        : { href: `${(CONFIG.COMMUNITY_URL || '').replace(/\/+$/, '')}/` },
    )

    /**
     * The member's own circle, drawn as the bar of the signed-in wallet draws it (Navbar.vue):
     * the small picture where the store holds one (AvatarButton.vue), otherwise the first two
     * letters of the user name in the colour of the real initials (AS-010).
     */
    const face = computed(() => {
      const { letters, colorSeed } = avatarLettering({
        alias: store.username,
        firstName: store.firstName,
        lastName: store.lastName,
      })
      return {
        src: store.avatar ? `data:image/jpeg;base64,${store.avatar}` : '',
        name: memberAlias(store.username, store.gradidoID),
        initials: letters,
        colorSeed,
      }
    })

    const backgroundHeader = '/img/template/gradido_background_header.png'
    // Dark mode uses a transparent, light-inked logo so it reads on the darkened
    // header blob; light mode keeps the original, in the 500px file the menu of the
    // logged-in wallet uses: below lg the logo also stands without the blob, 109px wide on a
    // phone, and a 3x screen asks 327 pixels of a file that had 200.
    const logo = computed(() =>
      store.darkMode ? '/img/brand/gradido-logo-white.png' : '/img/brand/gradido-logo.png',
    )

    return () => (
      <div class={['auth-header position-sticky', classes.authHeader]}>
        <BNavbar toggleable={false} container={false} class='d-flex'>
          {/* The logo leads home (Bernd, 14.10.2026): to the start page of this community -- its
              address, which is where somebody signed out begins -- and, with a session running,
              to the overview, as the logo of the signed-in wallet does. Named by what it shows,
              "Gradido"; the blob behind it says nothing. `alt` is no prop of BImg: it falls through
              to the <img>, as in the template. */}
          <BNavbarBrand
            class={['auth-home d-none d-lg-block', classes.authHome]}
            {...home.value}
            data-test='auth-home'
          >
            <BImg class='position-absolute p-2' src={logo.value} width='200' alt='Gradido' />
            <BImg src={backgroundHeader} width='230' alt='' />
          </BNavbarBrand>
          {/* Below lg no picture stands beside the form, so the logo needs no blob to stand on:
              it stands on the page, top left, where the leaves used to be. The links keep the
              place they have on the desk, top right, and the coin that stood in the card with
              them is gone -- the logo carries it. (Bernd, 21.09.2026) */}
          <BLink
            class={['auth-home auth-home-small d-lg-none', classes.authHome, classes.authHomeSmall]}
            {...home.value}
            data-test='auth-home-small'
          >
            <BImg
              class={['auth-logo-small', classes.authLogoSmall]}
              src={logo.value}
              alt='Gradido'
              data-test='auth-logo-small'
            />
          </BLink>
          <BCollapse id='nav-collapse' isNav>
            <BNavbarNav
              class={['auth-links ms-auto me-lg-4', classes.authLinks]}
              // no prop of BNavbarNav: it lands on the element as the empty attribute it was
              {...({ right: '' } as object)}
            >
              {/* With a session the member instead of the two links (ZE-038, L1a): their own
                  circle and "To my account", one link to the overview, where the logo leads too.
                  The face says "that is me", the word says where to. One link, not two, for one
                  goal: a keyboard stops once, and a screen reader reads the word alone -- the
                  circle is hidden from it, its letters would only spell the member's name. */}
              {signedIn.value ? (
                <NavItem
                  to='/overview'
                  class={['auth-navbar ms-lg-5', classes.authNavbar, classes.toAccount]}
                  data-test='auth-to-account'
                >
                  <AppAvatar
                    class={classes.toAccountFace}
                    size={30}
                    src={face.value.src}
                    name={face.value.name}
                    initials={face.value.initials}
                    colorSeed={face.value.colorSeed}
                    color='#fff'
                    aria-hidden='true'
                  />
                  <span class={classes.toAccountWord}>{t('auth.toAccount')}</span>
                </NavItem>
              ) : (
                <>
                  <NavItem
                    to={routeWithParamsAndQuery('Register', {
                      query: guarantorCodeReferrer(),
                    } as LinkOptions)}
                    class={['auth-navbar ms-lg-5', classes.authNavbar]}
                  >
                    {t('signup')}
                  </NavItem>
                  <NavItem
                    to={routeWithParamsAndQuery('Login', {
                      query: guarantorCodeReferrer(),
                    } as LinkOptions)}
                    class={['auth-navbar separator-start', classes.authNavbar]}
                  >
                    {t('signin')}
                  </NavItem>
                </>
              )}
            </BNavbarNav>
          </BCollapse>
        </BNavbar>
      </div>
    )
  },
})
