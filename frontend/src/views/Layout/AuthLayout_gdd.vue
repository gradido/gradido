<template>
  <div class="main-content">    
    <template>
      <div class="main-content">
        <router-view></router-view>   
        <content-footer v-if="!$route.meta.hideFooter"></content-footer>
      </div>
    </template>
  </div>
</template>
<script>
import ContentFooter from './ContentFooter.vue';
import { localeChanged } from 'vee-validate'
  export default { 
     components: {
      ContentFooter
    },
    data() {
      return {
        year: new Date().getFullYear(),
        pageClass: 'login-page'
      };
    },
    computed: {
      title() {
        return `${this.$route.name} Page`;
      }
    },
    methods: {
      setLocale(locale) {
        this.$i18n.locale = locale
        localeChanged()
        //this.$router.push({
        //  params: { lang: locale }
        //})
        //this.hideDropdown()
      }
    }
  };
  
</script>
<style lang="scss">
 
.card { background-color:rgba(136, 130, 131, 0.3); }
 
</style>
