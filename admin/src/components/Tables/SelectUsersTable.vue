<template>
  <div class="component-select-users-table">
    <b-table-lite :items="items" :fields="fields" caption-top striped hover stacked="md">
      <template #cell(bookmark)="row">
        <div>
          <b-button
            v-if="row.item.emailChecked"
            variant="warning"
            size="md"
            @click="$emit('push-item', row.item)"
            class="mr-2"
          >
            <b-icon icon="plus" variant="success"></b-icon>
          </b-button>
          <div v-else>{{ $t('e_mail') }}!</div>
        </div>
      </template>
    </b-table-lite>
  </div>
</template>
<script>
export default {
  name: 'SelectUsersTable',
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
