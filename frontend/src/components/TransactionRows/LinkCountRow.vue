<template>
  <div class="link-count-row">
    <b-row>
      <b-col cols="5">
        <div class="text-right">{{ $t('gdd_per_link.links_count') }}</div>
      </b-col>
      <b-col cols="7">
        <div class="gdd-transaction-list-link-count">{{ count }}</div>
      </b-col>
    </b-row>
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
