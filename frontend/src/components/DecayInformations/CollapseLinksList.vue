<template>
  <div class="collapse-links-list">
    <div class="d-flex">
      <div class="text-center pb-3 gradido-max-width">
        <b>{{ $t('links-list.header') }}</b>
        {{ transactionLinks }}
      </div>
    </div>
  </div>
</template>
<script>
export default {
  name: 'CollapseLinksList',
  props: {
    transactionLinks: { type: Array, required: true },
  },
}
</script>
