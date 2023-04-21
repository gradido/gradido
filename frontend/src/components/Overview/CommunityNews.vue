<!-- eslint-disable @intlify/vue-i18n/no-raw-text -->
<template>
  <div class="community-news">
    <b-card class="bg-white appBoxShadow gradido-border-radius">
      <h1>Gradido zu DankBar Umrechner</h1>
      <p>
        Tag des Jahres:
        <span id="tag">{{ tag }}</span>
      </p>
      <p>
        Faktor:
        <span id="faktor">{{ faktor }}</span>
      </p>
      <form>
        <label for="gradido">Gradido:</label>
        <input type="number" id="gradido" name="gradido" v-model="gradido" @input="inputGradido" />
        <br />
        <br />
        <label for="dankbar">DankBar:</label>
        <input type="number" id="dankbar" name="dankbar" v-model="dankbar" @input="inputDankbar" />
        <br />
        <br />
        <input type="button" value="Berechnen" @click="umrechnen()" />
      </form>
      <p id="ergebnis">{{ ergebnis }}</p>
      <!--
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
            </b-col>
          </b-row>

          <b-row class="my-5">
            <b-col cols="12">
              <div class="text-lg-right">
                <b-button variant="gradido" :href="item.url" target="_blank">
                  {{ $t('auth.left.learnMore') }}
                </b-button>
              </div>
            </b-col>
          </b-row>
        </b-card-body>
      </b-card>
    </div>
    --></b-card>
  </div>
</template>
<script>
import News from '@/assets/News/news.json'

// Berechne den heutigen Tag des Jahres
const jetzt = new Date()
const start = new Date(jetzt.getFullYear(), 0, 0)
const diff = jetzt - start + (start.getTimezoneOffset() - jetzt.getTimezoneOffset()) * 60 * 1000
const tag = Math.floor(diff / (1000 * 60 * 60 * 24))

// Berechne Faktor1 und Faktor2
const faktor1 = Math.pow(0.998098, tag)
const faktor2 = 1 / faktor1

export default {
  name: 'CommunityNews',
  data() {
    return {
      News,
      tag,
      faktor: faktor2.toFixed(2),
      gradido: '',
      dankbar: '',
      ergebnis: '',
    }
  },
  methods: {
    umrechnen() {
      if (this.gradido) {
        const ergebnis = this.gradido * faktor2
        this.dankbar = ergebnis.toFixed(2)
      } else if (this.dankbar) {
        const ergebnis = this.dankbar * faktor1
        this.gradido = ergebnis.toFixed(2)
      } else {
        this.ergebnis = 'Bitte geben Sie entweder Gradido oder DankBar ein'
      }
    },
    inputGradido(value) {
      if (this.dankbar) this.dankbar = ''
    },
    inputDankbar(value) {
      if (this.gradido) this.gradido = ''
    },
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
