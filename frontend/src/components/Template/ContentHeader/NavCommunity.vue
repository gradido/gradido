<template>
  <div class="nav-community">
    <div class="d-flex justify-content-center">
      <b-button variant="gradido" class="rounded-right" to="#edit">
        {{ $t('community.submitContribution') }}
      </b-button>
      <b-button variant="gradido" class="rounded-0" to="#my">
        {{ $t('community.myContributions') }}
      </b-button>
      <b-button variant="gradido" class="rounded-left" to="#all">
        {{ $t('community.community') }}
      </b-button>
    </div>
  </div>
</template>
<script>
export default {
  name: 'NavCommunity',
}
</script>
