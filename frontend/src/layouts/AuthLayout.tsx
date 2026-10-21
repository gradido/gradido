// AI-GENERATED — not an architecture reference
import { useQuery } from '@vue/apollo-composable'
import {
  BAvatar,
  BButton,
  BCard,
  BCardBody,
  BCol,
  BImg,
  BLink,
  BPopover,
  BRow,
  type ButtonVariant,
} from 'bootstrap-vue-next'
import { computed, defineComponent, onBeforeMount, watchEffect } from 'vue'
import { useI18n } from 'vue-i18n'
import { RouterView, useRoute } from 'vue-router'
import { AuthCarousel } from '@/components/Auth/AuthCarousel'
import { AuthFooter } from '@/components/Auth/AuthFooter'
import { AuthNavbar } from '@/components/Auth/AuthNavbar'
import { LanguageSwitch2 } from '@/components/LanguageSwitch2'
import CONFIG from '@/config'
import { projectBrandingBanner } from '@/graphql/projectBranding.graphql'
import { useWalletStore } from '@/store/useWalletStore'
import classes from './AuthLayout.module.scss'

// The elements keep the plain class names they had: the wallet's stylesheets address
// `.auth-template` and `.svg-type`, `setTextSize` looks the card up by `.page-font-size`, and
// the specs find the parts by them. The look comes from the module's classes beside them.
export const AuthLayout = defineComponent({
  name: 'AuthLayout',
  setup() {
    const { t, locale } = useI18n()
    const route = useRoute()

    const communityName = CONFIG.COMMUNITY_NAME
    const store = useWalletStore()
    const project = computed(() => {
      const urlParams = new URLSearchParams(window.location.search)
      return urlParams.get('project')
    })

    const setTextSize = (size: number) => {
      ;(document.querySelector('.page-font-size') as HTMLElement).style.fontSize = size + 'rem'
    }

    const { result: projectBannerResult, loading: projectBannerLoading } = useQuery(
      projectBrandingBanner,
      { project: project.value },
      { enabled: !!project.value },
    )

    onBeforeMount(() => {
      // clear state
      store.setProject(null)
    })
    const isDesktop = computed(() => window.innerWidth > 768)

    // put project value into store, if projectBrandingBanner query don't throw an error, so project exists
    watchEffect(() => {
      if (projectBannerResult.value) {
        store.setProject(project.value)
      }
    })

    const greeting = () => (
      // ps-4 on the phone: the greeting stands on the page, not in the card, so it takes the
      // card's 24px itself and lines up with the text inside it. mt-3: 16px of air below the
      // top row, which it stood pressed against (Bernd, 22.09.2026). A route can leave the
      // greeting out (meta.hideGreeting, as hideFooter for the footer); a project's banner
      // above is not touched by that.
      <BRow class={['auth-greeting', classes.authGreeting, 'mt-3 mt-md-5 ps-4 ps-md-0']}>
        <BCol lg='9' md='9' sm='12'>
          <div class='mb--2'>{t('welcome')}</div>
          <div class='h1 mb-0'>{communityName}</div>
          <div class='mb-0'>{t('1000thanks')}</div>
        </BCol>
        <BCol cols='3' class='text-end d-none d-sm-none d-md-inline'>
          <BAvatar src='/img/brand/gradido_coin_128x128.png' size='6rem' />
        </BCol>
      </BRow>
    )

    return () => (
      <div class={['auth-template', classes.authTemplate]}>
        <div class='h-100 align-middle'>
          <AuthNavbar class='index10' />

          <div
            class={['left-content-box', classes.leftContentBox, 'position-fixed d-none d-lg-block']}
          >
            {isDesktop.value ? (
              <div class={['bg-img-box', classes.bgImgBox, 'position-absolute w-100']}>
                <AuthCarousel class='carousel' />
              </div>
            ) : null}
            <div
              class={[
                'bg-txt-box',
                classes.bgTxtBox,
                'position-relative d-none d-lg-block text-center align-self-center',
              ]}
            >
              <BLink href={`https://gradido.net/${locale.value}`} target='_blank'>
                {/* `gradido` is the wallet's own variant (.btn-gradido, gradido.css) */}
                <BButton variant={'gradido' as ButtonVariant}>{t('auth.left.learnMore')}</BButton>
              </BLink>
            </div>
          </div>
          <BRow class='justify-content-md-center justify-content-lg-end'>
            <BCol sm='12' md='8' lg='6' class='zindex1000'>
              {/* ⛔ No margin of its own below md. It stood 16px inside the page edge, the card
                  body and the form's container added 24px and 12px more, and the fields came
                  to 82px from each edge of a 375px phone: 211px of width for an address.
                  Now the card stands on the page edge like every box in the wallet. */}
              <div class='mx-0 mx-md-4'>
                {projectBannerResult.value || projectBannerLoading.value ? (
                  <BRow class='d-none d-md-block'>
                    <BCol>
                      {projectBannerResult.value ? (
                        <BImg
                          src={projectBannerResult.value.projectBrandingBanner}
                          class='img-fluid rounded-like-card'
                          // no prop of BImg: it lands on the <img>, as it did
                          alt='project banner'
                        />
                      ) : null}
                    </BCol>
                  </BRow>
                ) : !route.meta.hideGreeting ? (
                  greeting()
                ) : null}
                <BCard
                  noBody
                  class={[
                    'auth-card',
                    classes.authCard,
                    'border-0 gradido-custom-background',
                    'page-font-size',
                    classes.pageFontSize,
                    {
                      'auth-card-without-greeting':
                        route.meta.hideGreeting &&
                        !projectBannerResult.value &&
                        !projectBannerLoading.value,
                      [classes.authCardWithoutGreeting]:
                        route.meta.hideGreeting &&
                        !projectBannerResult.value &&
                        !projectBannerLoading.value,
                    },
                  ]}
                >
                  <BRow class='p-4'>
                    <BCol cols='10'>
                      <LanguageSwitch2 class='ms-3' />
                    </BCol>
                    <BCol cols='2' class='text-end'>
                      <div id='popover-target-1' class='pointer'>
                        <BImg
                          src='/img/svg/type.svg'
                          width='19'
                          class={['svg-type', classes.svgType]}
                        />
                      </div>
                      <BPopover
                        target='popover-target-1'
                        // ⚠️ No prop of BPopover in bootstrap-vue-next 0.26: it lands on the
                        // popover as an attribute, as it did.
                        {...({ triggers: 'click' } as object)}
                        placement='top'
                        variant='dark'
                        // ⚠️ The scoped rule `.login-size-controller` never reached the popover:
                        // its root is a fragment and took no scope attribute. The class stays,
                        // the rule is gone -- it never applied.
                        customClass='login-size-controller'
                      >
                        <div class='text-light'>
                          <span class='pointer' onClick={() => setTextSize(0.85)}>
                            {t('85')}
                          </span>
                          <span
                            class='pointer separator-start ms-2 ps-2'
                            onClick={() => setTextSize(1)}
                          >
                            {t('100')}
                          </span>
                          <span
                            class='pointer separator-start ms-2 ps-2'
                            onClick={() => setTextSize(1.25)}
                          >
                            {t('125')}
                          </span>
                        </div>
                      </BPopover>
                    </BCol>
                  </BRow>
                  {/* ⛔ No coin and no links in here any more. Below md the coin slid into the
                      card, and the two links with it, 176px above the form; the logo top left
                      carries the coin and the links stand up there with it (AuthNavbar). A
                      project's banner still stands here on a phone, where the greeting is not
                      shown. */}
                  {projectBannerResult.value ? (
                    <BRow class='d-md-none mb-3'>
                      <BCol class='text-center'>
                        <BImg
                          src={projectBannerResult.value.projectBrandingBanner}
                          class='img-fluid ms-1 me-1 col-10 col-sm-10 rounded-20'
                          // no prop of BImg: it lands on the <img>, as it did
                          alt='project banner'
                        />
                      </BCol>
                    </BRow>
                  ) : null}
                  <BCardBody class={['', classes.cardBody]}>
                    <RouterView />
                  </BCardBody>
                </BCard>
              </div>
              {!route.meta.hideFooter ? <AuthFooter class='pe-5 mb-5' /> : null}
            </BCol>
          </BRow>
        </div>
      </div>
    )
  },
})
