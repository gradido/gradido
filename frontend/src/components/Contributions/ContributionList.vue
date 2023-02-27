<template>
  <div class="contribution-list">
    <div class="mb-3" v-for="item in items" :key="item.id + 'a'">
      <contribution-list-item
        v-if="item.state === 'IN_PROGRESS'"
        v-bind="item"
        @closeAllOpenCollapse="$emit('closeAllOpenCollapse')"
        :contributionId="item.id"
        :allContribution="allContribution"
        @update-contribution-form="updateContributionForm"
        @delete-contribution="deleteContribution"
        @update-state="updateState"
      />
    </div>
    <div class="mb-3" v-for="item2 in items" :key="item2.id">
      <contribution-list-item
        v-if="item2.state !== 'IN_PROGRESS'"
        v-bind="item2"
        @closeAllOpenCollapse="$emit('closeAllOpenCollapse')"
        :contributionId="item2.id"
        :allContribution="allContribution"
        @update-contribution-form="updateContributionForm"
        @delete-contribution="deleteContribution"
        @update-state="updateState"
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
import ContributionListItem from '@/components/Contributions/ContributionListItem'

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
    allContribution: {
      type: Boolean,
      required: false,
      default: false,
    },
  },
  data() {
    return {
      currentPage: 1,
      messages: [],
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
    updateState(id) {
      this.$emit('update-state', id)
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
