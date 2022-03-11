<template>
  <div class="decay-row">
    <b-row v-if="decay">
      <b-col cols="5">
        <div class="text-right">
          <b-icon icon="droplet-half" height="15" class="mb-1" />
        </div>
      </b-col>
      <b-col cols="7">
        <div class="gdd-transaction-list-item-decay">
          <decay-information-short decaytyp="short" :decay="decay" />
        </div>
      </b-col>
    </b-row>
  </div>
</template>
<script>
import DecayInformationShort from '../DecayInformations/DecayInformation-Short'
export default {
  name: 'DecayRow',
  components: {
    DecayInformationShort,
  },
  props: {
    decay: {
      type: Object,
      required: false,
    },
  },
}
</script>
