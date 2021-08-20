<template>
  <div>
    <div class="list-group">
      <div class="list-group-item gdt-transaction-list-item" v-b-toggle="'a' + date + ''">
        <!-- Icon  -->
        <div class="text-right" style="position: absolute">
          <b-icon icon="person-check" class="gradido-global-color-accent m-mb-1 font2em"></b-icon>
        </div>

        <!-- Collaps Button  -->
        <div class="text-right" style="width: 96%; position: absolute">
          <b-button class="btn-sm">
            <b>i</b>
          </b-button>
        </div>

        <!-- Betrag -->

        <b-row>
          <div class="col-6 text-right">
            <div>{{ $t('gdt.your-share') }}</div>
            <div>{{ $t('gdt.credit') }}</div>
          </div>
          <div class="col-6">
            <div><slot name="your-share"></slot></div>
            <div><slot name="credit"></slot></div>
          </div>
        </b-row>

        <!-- Betrag ENDE-->

        <!-- Nachricht-->
        <b-row v-if="comment">
          <div class="col-6 text-right">
            {{ $t('form.memo') }}
          </div>
          <div class="col-6"><slot name="memo"></slot></div>
        </b-row>

        <!-- Datum-->
        <b-row class="gdt-list-row text-header">
          <div class="col-6 text-right">
            {{ $t('form.date') }}
          </div>
          <div class="col-6"><slot name="date"></slot></div>
        </b-row>
      </div>

      <b-collapse :id="'a' + date + ''" class="pb-4">
        <b-row class="gdt-list-clooaps-header-text text-center pb-3">
          <div class="col h4">{{ $t('gdt.publisher') }}</div>
        </b-row>
      </b-collapse>
    </div>
  </div>
</template>
<script>
export default {
  props: {
    date: {
      type: Date,
      default: function () {
        return new Date()
      },
    },
    comment: { type: String, default: '' },
  },
}
</script>
