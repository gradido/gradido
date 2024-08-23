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
      </BButton>
    </div>
    <BListGroup>
      <BRow>
        <BCol cols="1" class="ms-1">{{ $t('federation.verified') }}</BCol>
        <BCol class="ms-3">{{ $t('federation.url') }}</BCol>
        <BCol class="ms-3">{{ $t('federation.name') }}</BCol>
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
  return [
    {
      foreign: false,
      url: 'https://stage5.gradido.net/api/',
      publicKey: '06d01a7525c1476aad7c18f70b871f606daa9376458a0b08db7383b3c83a6337',
      uuid: 'd889c953-b3f5-4eaa-abe7-e99e61247d8a',
      authenticatedAt: null,
      name: 'Gradido Test Stage 5',
      description: 'Gradido Test Community Stage 5',
      gmsApiKey: null,
      location: null,
      creationDate: '2024-07-06T11:55:32.611Z',
      createdAt: '2024-07-06T11:55:32.614Z',
      updatedAt: '2024-07-11T11:38:24.000Z',
      federatedCommunities: [
        {
          id: 795334,
          apiVersion: '1_0',
          endPoint: 'https://stage5.gradido.net/api/',
          lastAnnouncedAt: null,
          verifiedAt: null,
          lastErrorAt: null,
          createdAt: '2024-08-21T07:14:04.869Z',
          updatedAt: null,
          __typename: 'FederatedCommunity',
        },
      ],
      __typename: 'AdminCommunityView',
    },
    {
      foreign: true,
      url: 'https://stage4.gradido.net/api/',
      publicKey: '9916949cd3cc29b459a0da59b46c960c14ba6b2e0ed9bd4e91206d228e74cb41',
      uuid: '66a2588b-45c8-489f-9040-a5a11d6bdfb0',
      authenticatedAt: '2024-07-11T11:40:27.898Z',
      name: 'Gradido Test Stage 4',
      description: 'Gradido Test Community, Stage 4',
      gmsApiKey: null,
      location: null,
      creationDate: '2024-07-30T00:09:11.766Z',
      createdAt: '2024-07-06T11:57:37.800Z',
      updatedAt: '2024-07-30T15:10:37.000Z',
      federatedCommunities: [
        {
          id: 795337,
          apiVersion: '1_0',
          endPoint: 'https://stage4.gradido.net/api/',
          lastAnnouncedAt: '2024-08-22T17:58:45.810Z',
          verifiedAt: null,
          lastErrorAt: null,
          createdAt: '2024-08-21T07:16:41.247Z',
          updatedAt: null,
          __typename: 'FederatedCommunity',
        },
      ],
      __typename: 'AdminCommunityView',
    },
    {
      foreign: true,
      url: 'https://stage3.gradido.net/api/',
      publicKey: '9df29552fd3dc51b376c8152016cde700d585fe177a4969df5f56221403977a0',
      uuid: 'a37db69f-32ad-46f4-b4ae-6164c7463573',
      authenticatedAt: '2024-07-11T11:39:27.833Z',
      name: 'Gradido Development Stage3',
      description: 'Gradido Development Stage3 Test Community',
      gmsApiKey: null,
      location: null,
      creationDate: '2024-05-15T11:33:33.434Z',
      createdAt: '2024-07-06T11:56:37.744Z',
      updatedAt: '2024-07-11T11:39:27.000Z',
      federatedCommunities: [
        {
          id: 795336,
          apiVersion: '1_0',
          endPoint: 'https://stage3.gradido.net/api/',
          lastAnnouncedAt: '2024-08-22T17:59:34.254Z',
          verifiedAt: '2024-08-22T17:58:10.425Z',
          lastErrorAt: null,
          createdAt: '2024-08-21T07:15:33.542Z',
          updatedAt: '2024-08-22T17:58:10.000Z',
          __typename: 'FederatedCommunity',
        },
      ],
      __typename: 'AdminCommunityView',
    },
    {
      foreign: true,
      url: 'https://stage2.gradido.net',
      publicKey: '9c115e9f61aaeb67f9db6542df91cb2f20eeb4da3cac5b0794bae61322fbc0de',
      uuid: null,
      authenticatedAt: null,
      name: null,
      description: null,
      gmsApiKey: null,
      location: null,
      creationDate: null,
      createdAt: null,
      updatedAt: null,
      federatedCommunities: [
        {
          id: 795335,
          apiVersion: '1_0',
          endPoint: 'https://stage2.gradido.net/api/',
          lastAnnouncedAt: '2024-08-22T17:59:28.358Z',
          verifiedAt: null,
          lastErrorAt: null,
          createdAt: '2024-08-21T07:15:26.851Z',
          updatedAt: null,
          __typename: 'FederatedCommunity',
        },
      ],
      __typename: 'AdminCommunityView',
    },
  ]
})

watch(error, () => {
  if (error.value) toastError(error.value.message)
})

const animation = computed(() => (loading.value ? 'spin' : ''))
</script>
