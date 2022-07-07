<template>
  <div class="community-page">
    <div>
      <b-tabs content-class="mt-3" align="center">
        <b-tab :title="$t('community.writing')" active>
          <contribution-form />
        </b-tab>
        <b-tab :title="$t('community.myContributions')">
          <p>{{ $t('community.myContributions') }}</p>
        </b-tab>
        <b-tab :title="$t('navigation.community')">
          <p>{{ $t('navigation.community') }}</p>
        </b-tab>
      </b-tabs>
    </div>
  </div>
</template>
<script>
import ContributionForm from '@/components/Contributions/ContributionForm.vue'
export default {
  name: 'Community',
  components: {
    ContributionForm,
  },
}
</script>
