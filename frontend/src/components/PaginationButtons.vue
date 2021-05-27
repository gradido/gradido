<template>
  <div class="pagination-buttons">
    <b-row class="m-4">
      <b-col class="text-right">
        <b-button :disabled="!hasPrevious" @click="$emit('show-previous')">
          <b-icon icon="chevron-left" variant="primary">
          </b-icon>
        </b-button>
      </b-col>
      <b-col cols="2">
        <p class="text-center pt-2">{{ currentPage }} / {{ totalPages }}</p>
      </b-col>
      <b-col>
        <b-button :disabled="!hasNext" @click="$emit('show-next')">
          <b-icon icon="chevron-right" variant="primary">
          </b-icon>
        </b-button>
      </b-col>
    </b-row>
  </div>
</template>
<script>
 export default {
   name: 'PaginationButtons',
   props: {
     hasNext: { type: Boolean, default: false },
     hasPrevious: { type: Boolean, default: false },
     totalPages: { type: Number, default: 1 },
     currentPage: { type: Number, default: 1 },
   },
 }
</script>
