<template>
  <div class="link-count-row">
    <BRow>
      <BCol cols="5">
        <div class="text-right">{{ $t('gdd_per_link.links_count') }}</div>
      </BCol>
      <BCol cols="7">
        <div class="gdd-transaction-list-link-count">{{ count }}</div>
      </BCol>
    </BRow>
  </div>
</template>
<script>
export default {
  name: 'LinkCountRow',
  props: {
    count: {
      type: Number,
      required: true,
    },
  },
}
</script>
