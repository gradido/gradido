<template>
  <div class="contribution-list container">
    <div class="list-group" v-for="item in items" :key="item.id">
    {{item}}
      <contribution-list-item
        v-bind="item"
        :contributionId="item.id"
        @update-contribution-form="updateContributionForm"
        @delete-contribution="deleteContribution"
      />
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
      :hide-ellipsis="true"
    ></b-pagination>
  </div>
</template>
<script>
import ContributionListItem from '@/components/Contributions/ContributionListItem.vue'

export default {
  name: 'ContributionList',
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
    updateContributionForm(item) {
      this.$emit('update-contribution-form', item)
    },
    deleteContribution(item) {
      this.$emit('delete-contribution', item)
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
