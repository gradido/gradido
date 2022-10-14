export const authLinks = {
  computed: {
    login() {
      if (this.$route.params.code) return '/login/' + this.$route.params.code
      return '/login'
    },
    register() {
      if (this.$route.params.code) return '/register/' + this.$route.params.code
      return '/register'
    },
  },
}
