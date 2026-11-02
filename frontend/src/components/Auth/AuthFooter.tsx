// AI-GENERATED — not an architecture reference
import { BCol, BLink, BNav, BNavItem, BRow } from 'bootstrap-vue-next'
import { defineComponent } from 'vue'
import { useI18n } from 'vue-i18n'
import CONFIG from '@/config'
import IBiFacebook from '~icons/bi/facebook'
import IBiTwitterX from '~icons/bi/twitter-x'
import IBiYoutube from '~icons/bi/youtube'
import classes from './AuthFooter.module.css'

export const AuthFooter = defineComponent({
  name: 'AuthFooter',
  setup() {
    const { t, locale } = useI18n()

    const eventMatching = CONFIG.MATCHING_ACTIVE

    return () => (
      <footer class={['footer', classes.authFooter]}>
        <BRow class='mt-lg-7 mt-md-6 mt-4'>
          <BCol class='col-12 col-md-12 col-lg-6'>
            <div class='d-flex justify-content-center justify-content-md-center justify-content-lg-start ms-3'>
              {/* Centred like the row around it, also where the links take a second line: the
                  list is then as wide as the page, and without this its lines would start at the
                  left edge and pull the first two links out of the middle. */}
              <BNav class='nav-footer justify-content-center justify-content-lg-start'>
                <BNavItem href={`https://gradido.net/${locale.value}/impressum/`} target='_blank'>
                  {t('footer.imprint')}
                </BNavItem>
                <BNavItem href={`https://gradido.net/${locale.value}/datenschutz/`} target='_blank'>
                  {t('footer.privacy_policy')}
                </BNavItem>
                {/* A page of this wallet, so it opens in place. Only where the route exists:
                    routes.js registers it with the same flag. */}
                {eventMatching ? (
                  <BNavItem to='/project-matching' data-test='footer-event-matching'>
                    {t('footer.eventMatching')}
                  </BNavItem>
                ) : null}
              </BNav>
            </div>
          </BCol>
          <BCol class='col-12 col-md-12 col-lg-6 mt-4 mb-4 mt-lg-0 mb-lg-0'>
            {/* ms-4 on a phone: the page edge there is 6px (App.vue), and 6 + 24 puts this
                line where the text inside the card above it starts. */}
            <div class='d-flex align-items-center ms-4 ms-md-3 ms-lg-0 text-lg-end pt-1'>
              {t('followUs')}{' '}
              {/* The icons carry no text, so each link names where it leads; the platform's name
                  is a brand and stays as it is in every language. */}
              <BLink
                href='https://www.facebook.com/groups/Gradido/'
                target='_blank'
                aria-label={t('footer.socialLink', { platform: 'Facebook' })}
              >
                <IBiFacebook class='ms-3 me-3 c-grey' aria-hidden='true' />
              </BLink>
              <BLink
                href='https://twitter.com/gradido'
                target='_blank'
                aria-label={t('footer.socialLink', { platform: 'X' })}
              >
                <IBiTwitterX class='me-3 c-grey' font-scale='1' aria-hidden='true' />
              </BLink>
              <BLink
                href='https://www.youtube.com/c/GradidoNet'
                target='_blank'
                aria-label={t('footer.socialLink', { platform: 'YouTube' })}
              >
                <IBiYoutube class='me-3 c-grey' font-scale='1' aria-hidden='true' />
              </BLink>
              <BLink
                href='https://t.me/Gradido'
                target='_blank'
                aria-label={t('footer.socialLink', { platform: 'Telegram' })}
              >
                <svg
                  aria-hidden='true'
                  xmlns='http://www.w3.org/2000/svg'
                  width='16'
                  height='16'
                  fill='currentColor'
                  class='bi bi-telegram c-grey'
                  viewBox='0 0 16 16'
                >
                  <path d='M16 8A8 8 0 1 1 0 8a8 8 0 0 1 16 0zM8.287 5.906c-.778.324-2.334.994-4.666 2.01-.378.15-.577.298-.595.442-.03.243.275.339.69.47l.175.055c.408.133.958.288 1.243.294.26.006.549-.1.868-.32 2.179-1.471 3.304-2.214 3.374-2.23.05-.012.12-.026.166.016.047.041.042.12.037.141-.03.129-1.227 1.241-1.846 1.817-.193.18-.33.307-.358.336a8.154 8.154 0 0 1-.188.186c-.38.366-.664.64.015 1.088.327.216.589.393.85.571.284.194.568.387.936.629.093.06.183.125.27.187.331.236.63.448.997.414.214-.02.435-.22.547-.82.265-1.417.786-4.486.906-5.751a1.426 1.426 0 0 0-.013-.315.337.337 0 0 0-.114-.217.526.526 0 0 0-.31-.093c-.3.005-.763.166-2.984 1.09z' />
                </svg>
              </BLink>
            </div>
          </BCol>
        </BRow>
      </footer>
    )
  },
})
