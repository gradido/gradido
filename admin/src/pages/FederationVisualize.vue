<template>
  <div class="federation-visualize">
    <div class="d-flex justify-content-between align-items-center mb-3">
      <span class="h2">{{ $t('federation.gradidoInstances') }}</span>
      <BButton
        :animation="animation"
        data-test="federation-communities-refresh-btn"
        font-scale="2"
        @click="refetch"
      >
        <IBiArrowClockwise />
        <!--        <b-icon-->
        <!--          icon="arrow-clockwise"-->
        <!--          font-scale="2"-->
        <!--          :animation="animation"-->
        <!--          data-test="federation-communities-refresh-btn"-->
        <!--          @click="$apollo.queries.allCommunities.refresh()"-->
        <!--        ></b-icon>-->
      </BButton>
    </div>
    <BListGroup>
      <BRow>
        <BCol cols="1" class="ml-1">{{ $t('federation.verified') }}</BCol>
        <BCol class="ml-3">{{ $t('federation.url') }}</BCol>
        <BCol class="ml-3">{{ $t('federation.name') }}</BCol>
        <BCol cols="2">{{ $t('federation.lastAnnouncedAt') }}</BCol>
        <BCol cols="2">{{ $t('federation.createdAt') }}</BCol>
      </BRow>
      <BListGroupItem
        v-for="item in communities"
        :key="item.publicKey"
        :variant="!item.foreign ? 'primary' : 'warning'"
      >
        <community-visualize-item :item="item" />
      </BListGroupItem>
    </BListGroup>
  </div>
</template>

<script setup>
import { computed, watch } from 'vue'
import { useQuery } from '@vue/apollo-composable'
import { allCommunities } from '@/graphql/allCommunities'
import { useAppToast } from '@/composables/useToast'

const { toastError } = useAppToast()

const { result, loading, refetch, error } = useQuery(allCommunities, () => ({}), {
  fetchPolicy: 'network-only',
})

const communities = computed(() => {
  return result.value?.allCommunities || []
})

watch(error, () => {
  if (error.value) toastError(error.value.message)
})

const animation = computed(() => (loading.value ? 'spin' : ''))
</script>
