<template>
  <div class="project-branding-item">
    <BRow :title="item.description" @click="details = !details">
      <BCol cols="3">{{ item.name }}</BCol>
      <BCol cols="2">{{ item.alias }}</BCol>
      <BCol cols="2">{{ item.newUserToSpace }}</BCol>
      <BCol cols="3"><img :src="item.logoUrl" :alt="item.logoUrl" /></BCol>
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
import { ref, toRefs } from 'vue'
import ProjectBrandingForm from './ProjectBrandingForm.vue'
import { useMutation } from '@vue/apollo-composable'
import gql from 'graphql-tag'

const props = defineProps({
  item: { type: Object, required: true },
})
const { item } = toRefs(props)
const details = ref(false)
const emit = defineEmits(['update:item', 'deleted:item'])

function update(form) {
  const { mutate } = useMutation(gql`
    mutation upsertProjectBranding($input: ProjectBrandingInput!) {
      upsertProjectBranding(input: $input) {
        id
        name
        alias
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
