<template>
  <div>
    <b-list-group>
      <b-list-group-item >
        <router-link
          to="/transactions"
          v-html="$t('transaction.show_all', { count: count })"
        ></router-link>
      </b-list-group-item>
    </b-list-group>
  </div>
</template>

<script>
export default {
  name: 'GddTableFooter',
  props: {
    count: { count: Number },
  },
}
</script>

