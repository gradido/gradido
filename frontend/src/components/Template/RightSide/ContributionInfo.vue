<template>
  <div class="contribution-info d-none d-lg-block">
    <div v-if="hash === '#my'">
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
          <b-icon icon="x-circle" variant="danger"></b-icon>
          {{ $t('contribution.alert.rejected') }}
        </li>
      </ul>
    </div>
    <div v-if="hash === '#all'" show fade variant="secondary" class="text-dark">
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
          <b-icon icon="check" variant="success"></b-icon>
          {{ $t('contribution.alert.confirm') }}
        </li>
      </ul>
    </div>
    <div v-if="hash === '#edit'" show fade variant="secondary" class="text-dark">
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
  name: 'LastContributions',
  computed: {
    hash() {
      return this.$route.hash
    },
  },
}
</script>
