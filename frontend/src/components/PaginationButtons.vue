<template>
  <div class="pagination-buttons" v-if="totalRows > perPage">
    <b-row class="m-4">
      <b-col class="text-right">
        <b-button class="previous-page" :disabled="!hasPrevious" @click="currentValue--">
          <b-icon icon="chevron-left" variant="primary"></b-icon>
        </b-button>
      </b-col>
      <b-col cols="3">
        <p class="text-center pt-2">{{ value }} / {{ totalPages }}</p>
      </b-col>
      <b-col>
        <b-button class="next-page" :disabled="!hasNext" @click="currentValue++">
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
    perPage: { type: Number, required: true },
    value: { type: Number, required: true },
  },
  data() {
    return {
      currentValue: { type: Number, default: 1 },
    }
  },
  computed: {
    hasNext() {
      return this.value * this.perPage < this.totalRows
    },
    hasPrevious() {
      return this.value > 1
    },
    totalPages() {
      return Math.ceil(this.totalRows / this.perPage)
    },
  },
  created() {
    this.currentValue = this.value
  },
  watch: {
    currentValue() {
      if (this.currentValue !== this.value) this.$emit('input', this.currentValue)
    },
  },
}
</script>
