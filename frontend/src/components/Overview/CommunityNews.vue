<template>
  <div class="community-news">
    <div v-for="item in News" :key="item.locale">
      <b-card
        v-if="item.locale === $i18n.locale"
        class="bg-white appBoxShadow gradido-border-radius"
      >
        <b-card-body>
          <b-card-title class="h2">{{ item.text }}</b-card-title>

          <div class="h3">{{ item.date }}</div>

          <b-row class="my-5">
            <b-col>
              {{ item.extra }}
              <br />
              <br />
              <span v-if="item.extra2">
                {{ item.extra2 }}
              </span>
              <span v-if="item.email">
                <a :href="'mailto:' + item.email">{{ item.email }}</a>
              </span>
            </b-col>
          </b-row>

          <b-row class="my-5">
            <b-col cols="12">
              <div class="text-lg-right">
                <b-button v-if="item.url" variant="gradido" :href="item.url" target="_blank">
                  {{ item.button }}
                </b-button>
                <RouterLink v-else-if="item.internUrl" to="/settings/extern">
                  <b-button variant="gradido">
                    {{ item.button }}
                  </b-button>
                </RouterLink>
              </div>
            </b-col>
          </b-row>
        </b-card-body>
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
