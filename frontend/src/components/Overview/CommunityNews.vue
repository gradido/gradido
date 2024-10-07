<template>
  <div class="community-news">
    <div v-for="item in News" :key="item.locale">
      <BCard
        v-if="item.locale === $i18n.locale"
        class="bg-white app-box-shadow gradido-border-radius"
      >
        <BCardBody>
          <BCardTitle class="h2">{{ item.text }}</BCardTitle>

          <div class="h3">{{ item.date }}</div>

          <BRow class="my-5">
            <BCol>
              {{ item.extra }}
              <br />
              <br />
              <span v-if="item.extra2">
                {{ item.extra2 }}
              </span>
              <span v-if="item.email">
                <a :href="'mailto:' + item.email">{{ item.email }}</a>
              </span>
            </BCol>
          </BRow>

          <BRow class="my-5">
            <BCol cols="12" class="d-flex">
              <div class="ms-auto">
                <BButton v-if="item.url" variant="gradido" :href="item.url" target="_blank">
                  {{ item.button }}
                </BButton>
                <RouterLink v-else-if="item.internUrl" :to="item.internUrl">
                  <BButton variant="gradido">
                    {{ item.button }}
                  </BButton>
                </RouterLink>
              </div>
            </BCol>
          </BRow>
        </BCardBody>
      </BCard>
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
  background-image: url('/img/svg/Gradido_Blaetter_Mainpage.svg') !important;
}
</style>
