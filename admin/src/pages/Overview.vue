<template>
  <div class="admin-overview">
    <BCard
      data-test="open-creations-card"
      :border-variant="borderVariant"
      :header="creationsHeader"
      :header-bg-variant="variant"
      header-text-variant="white"
      align="center"
    >
      <BCardText>
        <BLink to="creation-confirm">
          <h1 data-test="open-creation">{{ openCreations }}</h1>
        </BLink>
      </BCardText>
    </BCard>
  </div>
</template>
<script setup>
import { adminListContributionsCount } from '@/graphql/adminListContributions.graphql'
import { ref, computed } from 'vue'
import { useStore } from 'vuex'
import { useQuery } from '@vue/apollo-composable'
import { BCard, BCardText, BLink } from 'bootstrap-vue-next'
import { useAppToast } from '@/composables/useToast'
import { useI18n } from 'vue-i18n'

const store = useStore()

const statusFilter = ref(['IN_PROGRESS', 'PENDING'])

const { t } = useI18n()

const { toastError } = useAppToast()

const { result, onResult, onError } = useQuery(adminListContributionsCount, {
  filter: {
    statusFilter: statusFilter.value,
    hideResubmission: true,
  },
})

onResult(({ data }) => {
  store.commit('setOpenCreations', data?.adminListContributions.contributionCount)
})

onError((error) => {
  toastError(error.message)
})

const openCreations = computed(() => result.value?.adminListContributions.contributionCount || 0)
const creationsHeader = computed(() =>
  openCreations.value < 1 ? t('not_open_creations') : t('open_creations'),
)
const variant = computed(() => (openCreations.value < 1 ? 'danger' : 'success'))
const borderVariant = computed(() => (openCreations.value < 1 ? 'primary' : 'success'))
</script>
