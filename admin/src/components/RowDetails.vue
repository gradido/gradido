<template>
  <b-card class="shadow-lg pl-3 pr-3 mb-5 bg-white rounded">
    <slot :name="slotName" />
    <div class="text-center">
      <b-button size="sm" @click="$emit('row-toogle-details', row, index)">
        <b-icon icon="x-circle" aria-label="Help"></b-icon>
        {{ $t('hide_details') }}
      </b-button>
    </div>
  </b-card>
</template>

<script>
export default {
  name: 'RowDetails',
  props: {
    row: { required: true, type: Object },
    slotName: { requried: true, type: String },
    type: { requried: true, type: String },
    index: { requried: true, type: Number },
  },
}
</script>
