// AI-GENERATED — not an architecture reference
import { defineComponent } from 'vue'
import { useI18n } from 'vue-i18n'
import { ContributionInfo } from '@/components/Template/RightSide/ContributionInfo'
import { VariantIcon } from '@/components/VariantIcon'

export const ContributionsTemplate = defineComponent({
  name: 'ContributionsTemplate',
  setup() {
    const { t } = useI18n()

    const contributionInfoDescriptions = [
      {
        icon: 'bell-fill',
        variant: 'primary',
        description: t('contribution.alert.pending'),
      },
      {
        icon: 'question',
        variant: '205',
        description: t('contribution.alert.in_progress'),
      },
      {
        icon: 'check',
        variant: 'success',
        description: t('contribution.alert.confirm'),
      },
      {
        icon: 'x-circle',
        variant: 'warning',
        description: t('contribution.alert.denied'),
      },
      {
        icon: 'trash',
        variant: 'danger',
        description: t('contribution.alert.deleted'),
      },
    ]

    return () => (
      <ContributionInfo
        v-slots={{
          contribute: () => (
            <div class='text-dark'>
              <div>
                <h3>{t('contribution.formText.yourContribution')}</h3>
                {t('contribution.formText.bringYourTalentsTo')}
                <div class='my-3'>
                  <b>{t('contribution.formText.describeYourCommunity')}</b>
                </div>
              </div>
            </div>
          ),
          'own-contributions': () => (
            <div class='text-dark'>
              <h4 class='alert-heading'>{t('community.myContributions')}</h4>
              <p>{t('contribution.alert.myContributionNoteList')}</p>
              <ul>
                {contributionInfoDescriptions.map((descriptionData) => (
                  <li key={descriptionData.icon}>
                    <VariantIcon icon={descriptionData.icon} variant={descriptionData.variant} />{' '}
                    {descriptionData.description}
                  </li>
                ))}
              </ul>
            </div>
          ),
          'all-contributions': () => (
            <div class='text-dark'>
              <h4 class='alert-heading'>{t('navigation.community')}</h4>
              <p>{t('contribution.alert.communityNoteList')}</p>
              <ul>
                {contributionInfoDescriptions.map((descriptionData) =>
                  descriptionData.icon !== 'trash' ? (
                    <li key={descriptionData.icon}>
                      <VariantIcon icon={descriptionData.icon} variant={descriptionData.variant} />{' '}
                      {descriptionData.description}
                    </li>
                  ) : null,
                )}
              </ul>
            </div>
          ),
        }}
      />
    )
  },
})
