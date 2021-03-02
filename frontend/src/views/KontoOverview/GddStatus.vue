<template>
  <div>
    <b-row>
        <b-col xl="6" md="6">
          <stats-card :title="$t('site.overview.current_balance')"
                      type="gradient-red"
                      sub-title="balance_gdd"
                      class="mb-4">
                {{ $store.state.user.balance.toFixed(4) }} GDD
            <template slot="footer">
              <span class="text-success mr-2">Wird immer angezeigt</span>
            </template>
          </stats-card>
        </b-col>
        <b-col xl="6" md="6">
          <stats-card :title="$t('site.overview.gradido_received')"
                      type="gradient-orange"
                      sub-title="balance_gdt"
                      class="mb-4">
                  {{  $store.state.user.balance_gdt.toFixed(4) }} GDT
            <template slot="footer"> 
              <span class="text-nowrap">Wird nur angezeigt wenn user GDT besitzt.</span>
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
      balance_gdt: this.$store.state.user.balance_gdt,
    }
  },
  mounted() {
    this.$store.dispatch('accountBalance')
  },
};
</script>