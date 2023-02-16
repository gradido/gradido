<template>
  <div class="contribution-info d-none d-lg-block">
    <div v-if="$store.state.communityTabIndex === 1">
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
          <b-icon icon="question-square" variant="warning"></b-icon>
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
    <div
      v-if="$store.state.communityTabIndex === 2"
      show
      fade
      variant="secondary"
      class="text-dark"
    >
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
          <b-icon icon="question-square" variant="warning"></b-icon>
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
    <div
      v-if="$store.state.communityTabIndex === 0"
      show
      fade
      variant="secondary"
      class="text-dark"
    >
      <div>
        <h3>{{ $t('contribution.formText.yourContribution') }}</h3>
        {{ $t('contribution.formText.bringYourTalentsTo') }}

        <div class="my-3">
          <b>{{ $t('contribution.formText.describeYourCommunity') }}</b>
        </div>
      </div>
    </div>
  </div>
</template>
<script>
export default {
  name: 'ContributionInfo',
  computed: {
    hash() {
      return this.$route.hash
    },
  },
}
</script>
