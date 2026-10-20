// AI-GENERATED — not an architecture reference
import { BCol, BTr } from 'bootstrap-vue-next'
import { defineComponent } from 'vue'
import { useI18n } from 'vue-i18n'
import { CONFIG } from '../config'
import classes from './ContentFooter.module.scss'

export const ContentFooter = defineComponent({
  name: 'ContentFooter',
  setup() {
    const { t, locale } = useI18n()

    const year = new Date().getFullYear()
    const version = CONFIG.APP_VERSION
    const hash = CONFIG.BUILD_COMMIT

    return () => (
      <>
        <hr class='mb-0' />
        <div class={classes.contentFooter}>
          <BTr class='mt-4 mb-4 justify-content-lg-between'>
            <BCol>
              <div class='copyright text-center text-lg-center text-muted'>
                {t('footer.copyright.year', { year })}{' '}
                <a
                  href={`https://gradido.net/${locale.value}`}
                  class='fw-bold ms-1 link-underline link-underline-opacity-0 link-underline-opacity-100-hover'
                  target='_blank'
                >
                  {t('footer.copyright.link')}
                </a>{' '}
                |{' '}
                <a
                  href={`https://github.com/gradido/gradido/commit/${hash}`}
                  target='_blank'
                  class='link-underline link-underline-opacity-0 link-underline-opacity-100-hover'
                >
                  {t('footer.app_version', { version })}
                </a>
              </div>
            </BCol>
          </BTr>
        </div>
      </>
    )
  },
})
