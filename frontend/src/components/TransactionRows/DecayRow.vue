<template>
  <div class="decay-row">
    <BRow v-if="decay">
      <BCol cols="5">
        <div class="text-end">
          <IBiDropletHalf height="15" class="mb-1" />
        </div>
      </BCol>
      <BCol cols="7">
        <div class="gdd-transaction-list-item-decay">
          <decay-information-short decaytyp="short" :decay="decay" />
        </div>
      </BCol>
    </BRow>
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
      type: String,
      required: false,
    },
  },
}
</script>
