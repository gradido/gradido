<template>
  <div class="admin-overview">
    <BCard
      v-show="openCreations > 0"
      border-variant="primary"
      :header="$t('open_creations')"
      header-bg-variant="danger"
      header-text-variant="white"
      align="center"
    >
      <BCardText>
        <BLink to="creation-confirm">
          <h1>{{ openCreations }}</h1>
          <h1>Layout test</h1>
        </BLink>
      </BCardText>
    </BCard>
    <BCard
      v-show="openCreations < 1"
      border-variant="success"
      :header="$t('not_open_creations')"
      header-bg-variant="success"
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
import { adminListContributions } from '../graphql/adminListContributions'
import { ref, computed, onMounted } from 'vue'
import { useStore } from 'vuex'
import { useQuery } from '@vue/apollo-composable'
import { BCard, BCardText, BLink } from 'bootstrap-vue-next'

const store = useStore()

const statusFilter = ref(['IN_PROGRESS', 'PENDING'])

const { result, error } = useQuery(adminListContributions, {
  statusFilter: statusFilter.value,
  hideResubmission: true,
})

const openCreations = computed(() => result.value?.adminListContributions.contributionCount || 0)

onMounted(() => {
  if (result.value) {
    store.commit('setOpenCreations', openCreations.value)
  }

  if (error.value) {
    // store.dispatch('toastError', error.value.message)
  }
})
</script>
