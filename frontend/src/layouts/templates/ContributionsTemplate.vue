<template>
  <contribution-info>
    <template #contribute>
      <div class="text-dark">
        <div>
          <h3>{{ $t('contribution.formText.yourContribution') }}</h3>
          {{ $t('contribution.formText.bringYourTalentsTo') }}

          <div class="my-3">
            <b>{{ $t('contribution.formText.describeYourCommunity') }}</b>
          </div>
        </div>
      </div>
    </template>
    <template #own-contributions>
      <div class="text-dark">
        <h4 class="alert-heading">{{ $t('community.myContributions') }}</h4>
        <p>
          {{ $t('contribution.alert.myContributionNoteList') }}
        </p>
        <ul>
          <li v-for="descriptionData in contributionInfoDescriptions" :key="descriptionData.icon">
            <variant-icon :icon="descriptionData.icon" :variant="descriptionData.variant" />
            {{ descriptionData.description }}
          </li>
        </ul>
      </div>
    </template>
    <template #all-contributions>
      <div class="text-dark">
        <h4 class="alert-heading">{{ $t('navigation.community') }}</h4>
        <p>
          {{ $t('contribution.alert.communityNoteList') }}
        </p>
        <ul>
          <template
            v-for="descriptionData in contributionInfoDescriptions"
            :key="descriptionData.icon"
          >
            <li v-if="descriptionData.icon !== 'trash'">
              <variant-icon :icon="descriptionData.icon" :variant="descriptionData.variant" />
              {{ descriptionData.description }}
            </li>
          </template>
        </ul>
      </div>
    </template>
  </contribution-info>
</template>
<script setup>
import ContributionInfo from '@/components/Template/RightSide/ContributionInfo.vue'
import { useI18n } from 'vue-i18n'

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
</script>
