// AI-GENERATED — not an architecture reference
import { defineComponent } from 'vue'
import { useI18n } from 'vue-i18n'
import { ContributionInfo } from '@/components/Template/RightSide/ContributionInfo'
import IBiBoxSeam from '~icons/bi/box-seam'
import IBiHeartFill from '~icons/bi/heart-fill'
import IBiSearch from '~icons/bi/search'

export const MatchingTemplate = defineComponent({
  name: 'MatchingTemplate',
  setup() {
    const { t } = useI18n()

    return () => (
      <ContributionInfo
        v-slots={{
          entries: () => (
            <div class='text-dark'>
              <h3>{t('matching.info.entries.heading')}</h3>
              <p>{t('matching.info.entries.text')}</p>
              <ul class='list-unstyled'>
                <li class='d-flex align-items-baseline gap-2 mb-1'>
                  <IBiHeartFill style='color: #f00' />
                  <span>
                    <strong>{t('matching.type.interesse.word')}</strong>
                    {' — '}
                    {t('matching.type.interesse.desc')}
                  </span>
                </li>
                <li class='d-flex align-items-baseline gap-2 mb-1'>
                  <IBiBoxSeam style='color: #10b981' />
                  <span>
                    <strong>{t('matching.type.angebot.word')}</strong>
                    {' — '}
                    {t('matching.type.angebot.desc')}
                  </span>
                </li>
                <li class='d-flex align-items-baseline gap-2 mb-1'>
                  <IBiSearch style='color: #4658ff' />
                  <span>
                    <strong>{t('matching.type.gesuch.word')}</strong>
                    {' — '}
                    {t('matching.type.gesuch.desc')}
                  </span>
                </li>
              </ul>
              <p>{t('matching.info.entries.paused')}</p>
            </div>
          ),
          about: () => (
            <div class='text-dark'>
              <h3>{t('matching.info.about.heading')}</h3>
              <p>{t('matching.info.about.p1')}</p>
              <p>{t('matching.info.about.p2')}</p>
            </div>
          ),
          position: () => (
            <div class='text-dark'>
              <h3>{t('matching.info.position.heading')}</h3>
              <p>{t('matching.info.position.p1')}</p>
              <p>{t('matching.info.position.p2')}</p>
            </div>
          ),
        }}
      />
    )
  },
})
