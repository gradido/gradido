<template>
  <div>
    <b-row>
        <b-col xl="6" md="6">
          <stats-card :title="$t('site.overview.current_balance')"
                      type="gradient-red"
                      sub-title="balance_gdd"
                      class="mb-4">
                {{ balance_gdd }} GDD
            <template slot="footer">
              <span class="text-success mr-2">Wird immer angezeigt</span>
            </template>
          </stats-card>
        </b-col>
        <b-col xl="6" md="6">
          <stats-card :title="$t('site.overview.gradido_received')"
                      type="gradient-orange"
                      :sub-title="balance_gtt"
                      class="mb-4">
                  {{ balance_gtt }} GTT
            <template slot="footer"> 
              <span class="text-nowrap">Wird nur angezeigt wenn user GTT besitzt.</span>
            </template>
          </stats-card>
        </b-col>
      </b-row>
  </div>
</template>

<script>
export default {
  name: 'GddStatus',
  data(){
    return {
      balance_gdd: this.$store.state.user.balance,
      balance_gtt: "0",
    }
  },
};
</script>