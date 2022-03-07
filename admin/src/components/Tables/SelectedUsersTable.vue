<template>
  <div class="component-selected-users-table">
    <b-table-lite :items="items" :fields="fields" caption-top striped hover stacked="md">
      <template #cell(bookmark)="row">
        <b-button variant="danger" size="md" @click="$emit('remove-item', row.item)" class="mr-2">
          <b-icon icon="x" variant="light"></b-icon>
        </b-button>
      </template>
    </b-table-lite>
  </div>
</template>
<script>
export default {
  name: 'SelectedUsersTable',
  props: {
    items: {
      type: Array,
      required: true,
    },
    fields: {
      type: Array,
      required: true,
    },
  },
}
</script>
