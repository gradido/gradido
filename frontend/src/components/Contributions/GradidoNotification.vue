<template>
  <div class="contribution-list-info container">
    <b-alert v-if="list === 'my'" show dismissible fade variant="secondary" class="text-dark">
      <h4 class="alert-heading">{{ $t('community.myContributions') }}</h4>
      <p>
        {{ $t('contribution.alert.myContributionNoteList') }}
      </p>
      <ul class="h2">
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
      <hr />
    </b-alert>
    <b-alert v-if="list === 'all'" show dismissible fade variant="secondary" class="text-dark">
      <h4 class="alert-heading">{{ $t('navigation.community') }}</h4>
      <p>
        {{ $t('contribution.alert.communityNoteList') }}
      </p>
      <ul class="h2">
        <li>
          <b-icon icon="bell-fill" variant="primary"></b-icon>
          {{ $t('contribution.alert.pending') }}
        </li>
        <li>
          <b-icon icon="check" variant="success"></b-icon>
          {{ $t('contribution.alert.confirm') }}
        </li>
      </ul>
    </b-alert>
  </div>
</template>
<script>
export default {
  name: 'ContributionListInfo',
  props: {
    list: { type: String, required: true },
  },
}
</script>
