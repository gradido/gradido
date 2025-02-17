<template>
  <div class="project-branding-item">
    <BRow :title="item.description" @click="details = !details">
      <BCol cols="3">
        {{ item.name }}
        <br />
        {{ frontendLoginUrl }}
        <BButton
          v-if="frontendLoginUrl"
          v-b-tooltip.hover
          variant="secondary"
          :title="$t('copy-to-clipboard')"
          @click.stop="copyToClipboard(frontendLoginUrl)"
        >
          <i class="fas fa-copy"></i>
        </BButton>
      </BCol>
      <BCol cols="2">{{ item.alias }}</BCol>
      <BCol cols="2">
        <span v-if="item.newUserToSpace" class="text-success">
          <i class="fas fa-check"></i>
        </span>
        <span v-else class="text-danger">
          <i class="fas fa-times"></i>
        </span>
      </BCol>
      <BCol cols="3" class="me-2">
        <img class="img-fluid" :src="item.logoUrl" :alt="item.logoUrl" />
      </BCol>
      <BCol cols="1">
        <BButton v-b-tooltip.hover variant="danger" :title="$t('delete')" @click.stop="deleteItem">
          <i class="fas fa-trash-alt"></i>
        </BButton>
      </BCol>
    </BRow>
    <BRow v-if="details || item.id === undefined" class="details">
      <BCol colspan="5">
        <BCard>
          <ProjectBrandingForm :model-value="item" @update:model-value="update" />
        </BCard>
      </BCol>
    </BRow>
  </div>
</template>

<script setup>
import { computed, ref, toRefs } from 'vue'
import ProjectBrandingForm from './ProjectBrandingForm.vue'
import { useI18n } from 'vue-i18n'
import { useMutation } from '@vue/apollo-composable'
import CONFIG from '@/config'
import gql from 'graphql-tag'
import { useAppToast } from '@/composables/useToast'

const { t } = useI18n()
const { toastSuccess, toastError } = useAppToast()

const props = defineProps({
  item: { type: Object, required: true },
})
const { item } = toRefs(props)
const details = ref(false)

const emit = defineEmits(['update:item', 'deleted:item'])
const frontendLoginUrl = computed(() => {
  if (item.value.alias && item.value.alias.length > 0) {
    return `${CONFIG.WALLET_LOGIN_URL}?project=${item.value.alias}`
  }
  return undefined
})

async function copyToClipboard(text) {
  try {
    await navigator.clipboard.writeText(text)
    toastSuccess(t('copied-to-clipboard'))
  } catch (err) {
    toastError(err.message)
  }
}

function update(form) {
  details.value = false
  const { mutate } = useMutation(gql`
    mutation upsertProjectBranding($input: ProjectBrandingInput!) {
      upsertProjectBranding(input: $input) {
        id
        name
        alias
        description
        spaceId
        newUserToSpace
        logoUrl
      }
    }
  `)

  mutate({
    input: { ...form },
  }).then(({ data }) => {
    emit('update:item', data.upsertProjectBranding)
  })
}
function deleteItem() {
  const { mutate } = useMutation(gql`
    mutation deleteProjectBranding($id: ID!) {
      deleteProjectBranding(id: $id)
    }
  `)

  mutate({
    id: item.value.id,
  }).then(() => {
    emit('deleted:item', item.value.id)
  })
}
</script>
