<template>
  <div class="nav-community container">
    <b-row class="nav-row">
      <b-col cols="12" lg="4" md="4" class="px-0">
        <b-btn active-class="btn-active" block variant="link" @click="handleClick(0)">
          <b-icon icon="pencil" class="mr-2" />
          {{ $t('community.submitContribution') }}
        </b-btn>
      </b-col>
      <b-col cols="12" lg="4" md="4" class="px-0">
        <b-btn active-class="btn-active" block variant="link" @click="handleClick(1)">
          <b-icon icon="person" class="mr-2" />
          {{ $t('community.myContributions') }}
        </b-btn>
      </b-col>
      <b-col cols="12" lg="4" md="4" class="px-0">
        <b-btn active-class="btn-active" block variant="link" @click="handleClick(2)">
          <b-icon icon="people" class="mr-2" />
          {{ $t('community.community') }}
        </b-btn>
      </b-col>
    </b-row>
  </div>
</template>
<script>
 export default {
   name: 'NavCommunity',
   methods: {
     handleClick(tab) {
       console.log('handleClick', tab)
       if (this.$route.params && this.$route.params.tab && Number(this.$route.params.tab) !== tab) {
         this.$router.push({ params: { tab } })
       }
     },
   },
   watch: {
     '$route.params.tab'(tab) {
       this.handleClick(tab)
     },
   },
 }
</script>
<style scoped>
.nav-row {
  background-color: rgb(209, 209, 209);
  border-radius: 26px;
}

.btn-active {
  background-color: rgb(23 141 129);
  color: white;
}
</style>
