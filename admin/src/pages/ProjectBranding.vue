<template>
  <div class="project-branding">
    <div class="d-flex justify-content-between align-items-center mb-3">
      <span class="h2">{{ $t('projectBranding.title') }}</span>
      <div>
        <BButton
          variant="primary"
          data-test="project-branding-add-btn"
          font-scale="2"
          class="me-3"
          :title="$t('projectBranding.addTooltip')"
          :disabled="isAddButtonDisabled"
          @click="createEntry"
        >
          <IBiPlus />
        </BButton>
        <BButton
          :animation="animation"
          data-test="project-branding-refresh-btn"
          font-scale="2"
          @click="refetch"
        >
          <IBiArrowClockwise />
        </BButton>
      </div>
    </div>
    <BListGroup>
      <BRow>
        <BCol cols="3" class="ms-1">{{ $t('name') }} + {{ $t('link') }}</BCol>
        <BCol cols="2">{{ $t('alias') }}</BCol>
        <BCol cols="2" :title="$t('projectBranding.newUserToSpaceTooltip')">
          {{ $t('projectBranding.newUserToSpace') }}
        </BCol>
        <BCol cols="3">{{ $t('logo') }}</BCol>
        <BCol cols="1">{{ $t('actions') }}</BCol>
      </BRow>
      <BListGroupItem v-for="item in projectBrandings" :key="item.id">
        <project-branding-item
          :item="item"
          @update:item="handleUpdateItem"
          @deleted:item="handleDeleteItem"
        />
      </BListGroupItem>
    </BListGroup>
  </div>
</template>

<script setup>
import { computed, watch, ref } from 'vue'
import { useQuery } from '@vue/apollo-composable'
import { useAppToast } from '@/composables/useToast'
import gql from 'graphql-tag'

const { toastError } = useAppToast()

const { result, loading, refetch, error } = useQuery(
  gql`
    query {
      projectBrandings {
        id
        name
        alias
        description
        spaceId
        newUserToSpace
        logoUrl
      }
    }
  `,
  null,
  {
    fetchPolicy: 'network-only',
  },
)

const projectBrandings = ref([])

const isAddButtonDisabled = computed(() => {
  return projectBrandings.value.some((item) => item.id === undefined)
})

watch(
  result,
  () => {
    projectBrandings.value = result.value?.projectBrandings || []
  },
  { immediate: true },
)

function createEntry() {
  projectBrandings.value.push({
    id: undefined,
    name: '',
    alias: '',
    description: undefined,
    spaceId: undefined,
    newUserToSpace: false,
    logoUrl: undefined,
  })
}

function handleUpdateItem(updatedItem) {
  const index = projectBrandings.value.findIndex(
    (item) => item.id === updatedItem.id || item.id === undefined,
  )
  projectBrandings.value.splice(index, 1, updatedItem)
}

function handleDeleteItem(id) {
  const index = projectBrandings.value.findIndex((item) => item.id === id)
  projectBrandings.value.splice(index, 1)
}

watch(error, () => {
  if (error.value) toastError(error.value.message)
})

const animation = computed(() => (loading.value ? 'spin' : ''))
</script>
