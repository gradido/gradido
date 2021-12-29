<template>
  <b-card class="shadow-lg pl-3 pr-3 mb-5 bg-white rounded">
    <b-row class="mb-2">
      <b-col></b-col>
    </b-row>
    <slot :name="slotName" />
    <b-button size="sm" @click="$emit('row-toogle-details', row, index)">
      <b-icon
        :icon="type === 'PageCreationConfirm' ? 'x' : 'eye-slash-fill'"
        aria-label="Help"
      ></b-icon>
      {{ $t('hide_details') }} {{ row.item.firstName }} {{ row.item.lastName }}
    </b-button>
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
