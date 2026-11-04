// AI-GENERATED — not an architecture reference
import { BCollapse, BImg, BLink, BNavbar, BNavbarBrand, BNavbarNav } from 'bootstrap-vue-next'
import { computed, defineComponent } from 'vue'
import { useI18n } from 'vue-i18n'
import { useRoute } from 'vue-router'
import { NavItem } from '@/components/Menu/NavItem'
import { useAuthLinks } from '@/composables/useAuthLinks'
import CONFIG from '@/config'
import { useWalletStore } from '@/store/useWalletStore'
import classes from './AuthNavbar.module.scss'

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
     * Where the logo leads. Signed out: the start page of this community, its own address
     * (`COMMUNITY_URL`), loaded afresh like the address typed -- on every server today the wallet,
     * which begins at the sign-in, and a community whose address is a homepage of its own gets
     * that. With a session: the overview, as the logo of the signed-in wallet (Navbar.vue).
     * Nothing of the page's address goes along.
     */
    const home = computed(() =>
      store.gradidoID
        ? { to: '/overview' }
        : { href: `${(CONFIG.COMMUNITY_URL || '').replace(/\/+$/, '')}/` },
    )

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
            </BNavbarNav>
          </BCollapse>
        </BNavbar>
      </div>
    )
  },
})
