<template>
  <div class="contribution-link">
    <BCard
      border-variant="success"
      :header="$t('contributionLink.contributionLinks')"
      header-bg-variant="success"
      header-text-variant="white"
      header-class="text-center"
      class="mt-5"
    >
      <BButton
        v-if="!editContributionLink"
        class="my-3 d-flex justify-content-left"
        data-test="new-contribution-link-button"
        @click="visible = !visible"
      >
        {{ $t('math.plus') }} {{ $t('contributionLink.newContributionLink') }}
      </BButton>

      <BCollapse id="newContribution" v-model="visible" class="mt-2">
        <BCard>
          <p class="h2 ml-5">{{ $t('contributionLink.contributionLinks') }}</p>
          <contribution-link-form
            :contribution-link-data="contributionLinkData"
            :edit-contribution-link="editContributionLink"
            @get-contribution-links="$emit('get-contribution-links')"
            @close-contribution-form="closeContributionForm"
          />
        </BCard>
      </BCollapse>

      <BCardText>
        <contribution-link-list
          v-if="count > 0"
          :items="items"
          @edit-contribution-link-data="editContributionLinkData"
          @get-contribution-links="$emit('get-contribution-links')"
          @close-contribution-form="closeContributionForm"
        />
        <div v-else>{{ $t('contributionLink.noContributionLinks') }}</div>
      </BCardText>
    </BCard>
  </div>
</template>

<script>
import ContributionLinkForm from '../ContributionLink/ContributionLinkForm'
import ContributionLinkList from '../ContributionLink/ContributionLinkList'

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
  emits: ['get-contribution-links'],
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
        this.visible = false
        this.editContributionLink = false
        this.contributionLinkData = {}
      }
    },
    editContributionLinkData(data) {
      if (!this.visible) {
        this.visible = true
      }
      this.contributionLinkData = data
      this.editContributionLink = true
    },
  },
}
</script>
