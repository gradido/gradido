<template>
  <div class="last-contributions d-none d-lg-block">
    <b-row class="mb-5">
      <b-col class="h3">{{ $t('contribution.lastContribution') }}</b-col>
      <b-col cols="1" class="text-right">
        <b-icon icon="three-dots-vertical"></b-icon>
      </b-col>
    </b-row>
  </div>
</template>
<script>
export default {
  name: 'LastContributions',
}
</script>
