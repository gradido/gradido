<template>
  <div class="contribution-list container">
    {{ items.length }}
    <div class="list-group" v-for="item in items" :key="item.id">
      <contribution-list-item v-bind="item" @update-contribution="updateContribution" />
    </div>
    <b-pagination
      v-if="isPaginationVisible"
      class="mt-3"
      pills
      size="lg"
      v-model="currentPage"
      :per-page="pageSize"
      :total-rows="contributionCount"
      align="center"
    ></b-pagination>
  </div>
</template>
<script>
import ContributionListItem from '@/components/Contributions/ContributionListItem.vue'
export default {
  components: {
    ContributionListItem,
  },
  props: {
    items: {
      type: Array,
      required: true,
    },
    contributionCount: {
      type: Number,
      required: true,
    },
    showPagination: {
      type: Boolean,
      required: true,
    },
    pageSize: { type: Number, default: 25 },
  },
  data() {
    return {
      currentPage: 1,
    }
  },
  methods: {
    updateListContributions() {
      this.$emit('update-list-contributions', {
        currentPage: this.currentPage,
        pageSize: this.pageSize,
      })
      window.scrollTo(0, 0)
    },
    updateContribution(item) {
      this.$emit('update-contribution', item)
    },
  },
  computed: {
    isPaginationVisible() {
      return this.showPagination && this.pageSize < this.contributionCount
    },
  },
  watch: {
    currentPage() {
      this.updateListContributions()
    },
  },
}
</script>
