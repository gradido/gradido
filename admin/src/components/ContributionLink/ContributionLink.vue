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
        v-if="isAdmin && !editContributionLink"
        class="my-3 d-flex justify-content-left"
        data-test="new-contribution-link-button"
        @click="visible = !visible"
      >
        {{ $t('math.plus') }} {{ $t('contributionLink.newContributionLink') }}
      </BButton>

      <BCollapse id="newContribution" v-model="visible" class="mt-2">
        <BCard>
          <p class="h2 ms-5">{{ $t('contributionLink.contributionLinks') }}</p>
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

<script setup>
import { ref } from 'vue'
import ContributionLinkForm from '../ContributionLink/ContributionLinkForm'
import ContributionLinkList from '../ContributionLink/ContributionLinkList'
import { useIsAdmin } from '@/composables/useIsAdmin'

defineProps({
  items: {
    type: Array,
    required: true,
  },
  count: {
    type: Number,
    required: true,
  },
})

defineEmits(['get-contribution-links'])

const visible = ref(false)
const contributionLinkData = ref({})
const editContributionLink = ref(false)

// Creating a starting balance is an administrator's job. Moderators may look the links
// up and pass them on, so they keep the list and the QR-code view.
const isAdmin = useIsAdmin()

const closeContributionForm = () => {
  if (visible.value) {
    visible.value = false
    editContributionLink.value = false
    contributionLinkData.value = {}
  }
}

const editContributionLinkData = (data) => {
  if (!visible.value) {
    visible.value = true
  }
  contributionLinkData.value = data
  editContributionLink.value = true
}
</script>
