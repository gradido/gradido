<template>
  <div class="pagination-buttons">
    <b-row class="m-4">
      <b-col class="text-right">
        <b-button class="previous-page" :disabled="!hasPrevious" @click="$emit('show-previous')">
          <b-icon icon="chevron-left" variant="primary"></b-icon>
        </b-button>
      </b-col>
      <b-col cols="3">
        <p class="text-center pt-2">{{ value }} / {{ totalPages }}</p>
      </b-col>
      <b-col>
        <b-button class="next-page" :disabled="!hasNext" @click="$emit('show-next')">
          <b-icon icon="chevron-right" variant="primary"></b-icon>
        </b-button>
      </b-col>
    </b-row>
  </div>
</template>
<script>
 export default {
   name: 'PaginationButtons',
   props: {
     totalRows: { type: Number, required: true },
     pageSize: { type: Number, required: true },
     value: { type: Number, , required: true },
   },
   computed: {
     hasNext() {
       return this.value * this.pageSize < this.totalCount
     },
     hasPrevious() {
       return this.value > 1
     },
     totalPages() {
       return Math.ceil(this.totalCount / this.pageSize)
     },
   },
   methods: {
     showNext() {
       this.value++
       this.updateGdt()
       window.scrollTo(0, 0)
     },
     showPrevious() {
       this.value--
       this.updateGdt()
       window.scrollTo(0, 0)
     },
   },
 }
</script>
