<template>
  <div class="page_decaycalculator">
    <!-- Header -->
    <div class="p-3">
      <b-container>
        <div class="text-center">
          <h1>Gradido</h1>
          <p class="text-lead">{{ $t('site.login.community') }}</p>
        </div>
      </b-container>
    </div>
    <b-container>
      <h3 class="text-center">{{ $t('decay-calculation.decay-calculator') }}</h3>
      <decay-calculator />
    </b-container>
    <div class="text-center">
      <router-link to="/Login" class="mt-3">{{ $t('back') }}</router-link>
    </div>
  </div>
</template>
<script>
import DecayCalculator from '../../../components/DecayCalculator/DecayCalculator.vue'

export default {
  name: 'DecayCalculatorPage',
  components: {
    DecayCalculator,
  },
}
</script>
<style></style>
