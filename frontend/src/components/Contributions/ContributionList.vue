<template>
  <div class="contribution-list">
    <div v-for="item in items" :key="item.id + 'a'" class="mb-3">
      <contribution-list-item
        v-if="item.status === 'IN_PROGRESS'"
        v-bind="item"
        :contribution-id="item.id"
        :all-contribution="allContribution"
        @close-all-open-collapse="$emit('close-all-open-collapse')"
        @update-contribution-form="updateContributionForm"
        @delete-contribution="deleteContribution"
        @update-status="updateStatus"
      />
    </div>
    <div v-for="item2 in items" :key="item2.id" class="mb-3">
      <contribution-list-item
        v-if="item2.status !== 'IN_PROGRESS'"
        v-bind="item2"
        :contribution-id="item2.id"
        :all-contribution="allContribution"
        @close-all-open-collapse="$emit('close-all-open-collapse')"
        @update-contribution-form="updateContributionForm"
        @delete-contribution="deleteContribution"
        @update-status="updateStatus"
      />
    </div>
    <BPagination
      v-if="isPaginationVisible"
      v-model="currentPage"
      class="mt-3"
      pills
      size="lg"
      :per-page="pageSize"
      :total-rows="contributionCount"
      align="center"
      :hide-ellipsis="true"
    />
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
    updateStatus(id) {
      this.$emit('update-status', id)
    },
  },
}
</script>
