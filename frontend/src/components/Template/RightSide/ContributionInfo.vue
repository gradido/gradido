<template>
  <div class="contribution-info">
    <div>
      <h3>{{ $t('contribution.formText.yourContribution') }}</h3>
      {{ $t('contribution.formText.bringYourTalentsTo') }}

      <div class="my-3">
        <b>{{ $t('contribution.formText.describeYourCommunity') }}</b>
      </div>
    </div>
  </div>
</template>
<script>
export default {
  name: 'LastContributions',
}
</script>
