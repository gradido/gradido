<template>
  <div>
    <b-row>
        <b-col xl="6" md="6">
          <stats-card :title="$t('site.overview.current_balance')"
                      type="gradient-red"
                      sub-title="3500,897 GDD"
                      img="img/icons/gradido/my_gradido.png"
                      class="mb-4">

            <template slot="footer">
              <span class="text-success mr-2">+ 3.48%</span>
              <span class="text-nowrap">{{ $t('site.overview.since_last_month') }}</span>
            </template>
          </stats-card>
        </b-col>
        <b-col xl="6" md="6">
          <stats-card :title="$t('site.overview.gradido_received')"
                      type="gradient-orange"
                      sub-title="2,356 GDD"
                      img="img/icons/gradido/plus.png"
                      class="mb-4">

            <template slot="footer">
              <span class="text-success mr-2">+ 12.18%</span>
              <span class="text-nowrap">{{ $t('site.overview.since_last_month') }}</span>
            </template>
          </stats-card>
        </b-col>
      </b-row>
  </div>
</template>

<script>
export default {
  name: 'GddStatus',
};
</script>