<template>
  <b-card class="shadow-lg ps-3 pe-3 mb-5 bg-white rounded">
    <slot :name="slotName" />
    <b-button size="sm" @click="$emit('row-toggle-details', row, index)">
      <b-icon
        :icon="type === 'PageCreationConfirm' ? 'x' : 'eye-slash-fill'"
        aria-label="Help"
      ></b-icon>
      {{ $t('hide_details') }}
    </b-button>
  </b-card>
</template>

<script>
export default {
  name: 'RowDetails',
  props: {
    row: { required: true, type: Object },
    slotName: { required: true, type: String },
    type: { required: true, type: String },
    index: { required: true, type: Number },
  },
  emits: ['row-toggle-details'],
}
</script>
