<template>
  <div id="app"></div>
</template>

<script>
export default {
  name: 'App',
  methods: {
    async readToken() {
      if (window.localStorage && window.localStorage.vuex) {
        this.$store.commit('token', JSON.parse(window.localStorage.vuex).token)
      }
    },
  },
  created() {
    this.readToken()
  },
}
</script>
