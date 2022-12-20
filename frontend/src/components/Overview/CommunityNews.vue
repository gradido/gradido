<template>
  <div class="community-news">
    <div v-for="item in News" :key="item.id" class="mb-5">
      <b-card class="bg-white appBoxShadow gradido-border-radius">
        <div class="h2 mb-5">{{ item.text }}</div>
        <b-row class="my-5">
          <b-col>
            <div class="h4">{{ item.date }}</div>
          </b-col>
          <b-col>
            <div class="text-right">
              <b-button variant="gradido">{{ $t('auth.left.learnMore') }}</b-button>
            </div>
          </b-col>
        </b-row>
        <div class="my-5">{{ item.extra }}</div>
      </b-card>
    </div>
  </div>
</template>
<script>
import News from '@/assets/News/news.json'
export default {
  name: 'CommunityNews',
  data() {
    return {
      News,
    }
  },
}
</script>
<style scoped>
.card {
  height: 400px;
  background-attachment: absolute;
  background-position: center;
  background-repeat: no-repeat;
  background-size: 350px 350px;
  background-image: url(/img/svg/Gradido_Blaetter_Mainpage.svg) !important;
}
</style>
