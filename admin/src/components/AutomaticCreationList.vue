<template>
  <div>
    <b-table striped hover :items="items" :fields="fields">
      <template #cell(delete)>
        <b-button variant="danger" size="md" class="mr-2">
          <b-icon icon="trash" variant="light"></b-icon>
        </b-button>
      </template>
      <template #cell(edit)>
        <b-button variant="success" size="md" class="mr-2">
          <b-icon icon="pencil" variant="light"></b-icon>
        </b-button>
      </template>
      <template #cell(show)>
        <b-button variant="info" size="md" class="mr-2">
          <b-icon icon="eye" variant="light"></b-icon>
        </b-button>
      </template>
    </b-table>
  </div>
</template>
<script>
export default {
  name: 'AutomaticCreationList',
  props: {
    items: { type: Array },
  },
  data() {
    return {
      fields: ['Name', 'Text', 'GDD', 'startDate', 'endDate', 'delete', 'edit', 'show'],
    }
  },
}
</script>
