<template>
  <div class="community-news">
    <div v-for="item in News" :key="item.locale">
      <b-card
        v-if="item.locale === $i18n.locale"
        class="bg-white appBoxShadow gradido-border-radius"
      >
        <b-card-body>
          <b-card-title class="h2">{{ item.text }}</b-card-title>
        </b-card-body>
        <b-card-footer class="bg-transparent">
          <b-card-text>
            <b-row>
              <b-col cols="12" md="6" lg="6">
                <div class="h3">{{ item.date }}</div>
              </b-col>
              <b-col cols="12" md="6" lg="6">
                <div class="text-right">
                  <b-button variant="gradido" :href="item.url" target="_blank">
                    {{ $t('auth.left.learnMore') }}
                  </b-button>
                </div>
              </b-col>
            </b-row>
          </b-card-text>
          <b-card-tex>{{ item.extra }}</b-card-tex>
        </b-card-footer>
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
  background-attachment: absolute;
  background-position: center;
  background-repeat: no-repeat;
  background-size: 350px 350px;
  background-image: url(/img/svg/Gradido_Blaetter_Mainpage.svg) !important;
}
</style>
