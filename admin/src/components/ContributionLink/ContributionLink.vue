<template>
  <div class="contribution-link">
    <b-card
      border-variant="success"
      :header="$t('contributionLink.contributionLinks')"
      header-bg-variant="success"
      header-text-variant="white"
      header-class="text-center"
      class="mt-5"
    >
      <b-button
        v-if="!editContributionLink"
        v-b-toggle.newContribution
        class="my-3 d-flex justify-content-left"
      >
        {{ $t('math.plus') }} {{ $t('contributionLink.newContributionLink') }}
      </b-button>

      <b-collapse v-model="visible" id="newContribution" class="mt-2">
        <b-card>
          <p class="h2 ml-5">{{ $t('contributionLink.contributionLinks') }}</p>
          <contribution-link-form
            :contributionLinkData="contributionLinkData"
            :editContributionLink="editContributionLink"
            @get-contribution-links="$emit('get-contribution-links')"
            @closeContributionForm="closeContributionForm"
          />
        </b-card>
      </b-collapse>

      <b-card-text>
        <contribution-link-list
          v-if="count > 0"
          :items="items"
          @editContributionLinkData="editContributionLinkData"
          @get-contribution-links="$emit('get-contribution-links')"
        />
        <div v-else>{{ $t('contributionLink.noContributionLinks') }}</div>
      </b-card-text>
    </b-card>
  </div>
</template>
<script>
import ContributionLinkForm from '../ContributionLink/ContributionLinkForm.vue'
import ContributionLinkList from '../ContributionLink/ContributionLinkList.vue'

export default {
  name: 'ContributionLink',
  components: {
    ContributionLinkForm,
    ContributionLinkList,
  },
  props: {
    items: {
      type: Array,
      required: true,
    },
    count: {
      type: Number,
      required: true,
    },
  },
  data: function () {
    return {
      visible: false,
      contributionLinkData: {},
      editContributionLink: false,
    }
  },
  methods: {
    closeContributionForm() {
      if (this.visible) {
        this.$root.$emit('bv::toggle::collapse', 'newContribution')
        this.editContributionLink = false
      }
    },
    editContributionLinkData(data) {
      if (!this.visible) {
        this.$root.$emit('bv::toggle::collapse', 'newContribution')
      }
      this.contributionLinkData = data
      console.log('contributionLinkData', this.contributionLinkData)
      this.editContributionLink = true
    },
  },
}
</script>
