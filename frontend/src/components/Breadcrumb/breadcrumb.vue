<template>
  <div class="breadcrumb bg-transparent">
    <div v-switch="path">
      <h2 v-case="'/overview'">overview</h2>
      <h2 v-case="'/send'">send</h2>
      <h2 v-case="'/transactions'">transactions</h2>
      <h2 v-case="'/gdt'">gdt</h2>
      <h2 v-case="'/community'">community</h2>
      <h2 v-case="'/information'">information</h2>
      <h2 v-case="'/settings'">settings</h2>
      <h2 v-default>Default</h2>
    </div>
    {{ this.$route.bread }}
  </div>
</template>
<script>
export default {
  name: 'Breadcrumb',
  computed: {
    path() {
      return this.$route.path
    },
  },
}
</script>
