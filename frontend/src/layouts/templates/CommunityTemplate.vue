<template>
  <contribution-info>
    <template #contribute>
      <div show fade variant="secondary" class="text-dark">
        <div>
          <h3>{{ $t('contribution.formText.yourContribution') }}</h3>
          {{ $t('contribution.formText.bringYourTalentsTo') }}

          <div class="my-3">
            <b>{{ $t('contribution.formText.describeYourCommunity') }}</b>
          </div>
        </div>
      </div>
    </template>
    <template #contributions>
      <div show fade variant="secondary" class="text-dark">
        <h4 class="alert-heading">{{ $t('community.myContributions') }}</h4>
        <p>
          {{ $t('contribution.alert.myContributionNoteList') }}
        </p>
        <ul>
          <li>
            <b-icon icon="bell-fill" variant="primary"></b-icon>
            {{ $t('contribution.alert.pending') }}
          </li>
          <li>
            <b-icon icon="question" variant="205"></b-icon>
            {{ $t('contribution.alert.in_progress') }}
          </li>
          <li>
            <b-icon icon="check" variant="success"></b-icon>
            {{ $t('contribution.alert.confirm') }}
          </li>
          <li>
            <b-icon icon="x-circle" variant="warning"></b-icon>
            {{ $t('contribution.alert.denied') }}
          </li>
          <li>
            <b-icon icon="trash" variant="danger"></b-icon>
            {{ $t('contribution.alert.deleted') }}
          </li>
        </ul>
      </div>
    </template>
    <template #community>
      <div show fade variant="secondary" class="text-dark">
        <h4 class="alert-heading">{{ $t('navigation.community') }}</h4>
        <p>
          {{ $t('contribution.alert.communityNoteList') }}
        </p>
        <ul>
          <li>
            <b-icon icon="bell-fill" variant="primary"></b-icon>
            {{ $t('contribution.alert.pending') }}
          </li>
          <li>
            <b-icon icon="question" variant="205"></b-icon>
            {{ $t('contribution.alert.in_progress') }}
          </li>
          <li>
            <b-icon icon="check" variant="success"></b-icon>
            {{ $t('contribution.alert.confirm') }}
          </li>
          <li>
            <b-icon icon="x-circle" variant="warning"></b-icon>
            {{ $t('contribution.alert.denied') }}
          </li>
        </ul>
      </div>
    </template>
  </contribution-info>
</template>
<script>
import ContributionInfo from '@/components/Template/RightSide/ContributionInfo.vue'

export default {
  name: 'CommunityTemplate',
  components: {
    ContributionInfo,
  },
}
</script>
