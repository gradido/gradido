<template>
  <div class="federation-visualize-item">
    <b-row>
      <b-col><b-icon :icon="icon" :variant="variant" class="mr-4"></b-icon></b-col>
      <b-col class="ml-1">{{ item.apiVersion }}</b-col>
      <b-col>{{ item.createdAt }}</b-col>
      <b-col>{{ item.lastAnnouncedAt }}</b-col>
      <b-col>{{ item.verifiedAt }}</b-col>
      <b-col>{{ item.lastErrorAt }}</b-col>
    </b-row>
  </div>
</template>
<script>
export default {
  name: 'FederationVisualizeItem',
  props: {
    item: { type: Object },
  },
  computed: {
    verified() {
      return new Date(this.item.verifiedAt) >= new Date(this.item.lastAnnouncedAt)
    },
    icon() {
      return this.verified ? 'check' : 'x-circle'
    },
    variant() {
      return this.verified ? 'success' : 'danger'
    },
  },
}
</script>
