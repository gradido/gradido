<template>
  <div class="show-contribution-link-information">
    <p class="text-center h2">{{communityName}} möchte dir hiermit  200 GDD schenken. </p>
    <p class="text-center text-monospace h3">MEMO TEXT von der automatischen Contribution </p>
    <div class="text-center h1 mt-5">Hast du schon ein Gradido Konto ? </div>
    <b-container class="mt-4">
      <b-card no-body class="overflow-hidden">
        <b-row no-gutters align-v="center">
          <b-col md="4 text-center">
            <b-img src="/img/brand/gradido_coin●.png" alt="Image" height="80" width="0"></b-img>
          </b-col>
          <b-col md="8">
            <b-card-body>
              <b-card-text>
                <div class="h2">Ja, Ich habe schon ein Gradido Konto</div>
                <b-button :href="urlLogin" target="_blank" size="lg" class="m-5">Login</b-button>
                <div><small>{{ urlLogin }}</small></div>
              </b-card-text>
            </b-card-body>
          </b-col>
        </b-row>
      </b-card>
      <hr>
      <b-card no-body class="overflow-hidden">
        <b-row no-gutters align-v="center">
          <b-col md="4 text-center">
            <b-img src="/img/brand/gradido_coin●.png" alt="Image" height="80" width="0"></b-img>
          </b-col>
          <b-col md="8">
            <b-card-body>
              <b-card-text>
                <div class="h2">Nein, Ich habe noch kein Gradido Konto</div>
                <b-button :href="urlRegister" target="_blank" size="lg" class="m-5" >Register</b-button>
                <div><small>{{ urlRegister }}</small></div>
              </b-card-text>
            </b-card-body>
          </b-col>
        </b-row>
      </b-card>
    </b-container>
  </div>
</template>
<script>
import CONFIG from '@/config'

export default {
  name: 'ContributionLink',
  components: {},
  data() {
    return {
      urlLogin: '',
      urlRegister: '',
      communityName: CONFIG.COMMUNITY_NAME,
    }
  },
  methods: {},
  computed: {},
  created() {
    this.urlLogin = 'http://localhost/contribution-link-login/' + this.$route.params.code
    this.urlRegister = 'http://localhost/contribution-link-register/' + this.$route.params.code
  },
}
</script>
