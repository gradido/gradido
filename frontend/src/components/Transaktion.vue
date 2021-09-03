<template>
  <div>
    <div class="list-group">
      <div class="list-group-item gdt-transaction-list-item" v-b-toggle="'a' + date + ''">
        <!-- Icon  -->
        <div class="text-right" style="position: absolute">
            ICON
         <b-icon
              v-if="gdtEntryType"
              :icon="getIcon(gdtEntryType).icon"
              :class="getIcon(gdtEntryType).class"
            ></b-icon>
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
              text1Betrag
            <!-- <div>{{ $t('gdt.your-share') }}</div>
            <div>{{ $t('gdt.credit') }}</div> -->
          </div>
          <div class="col-6">
              text1Betrag
            <!-- <div><slot name="your-share"></slot></div>
            <div><slot name="credit"></slot></div> -->
          </div>
        </b-row>

        <!-- Betrag ENDE-->

        <!-- Nachricht-->
        <b-row v-if="comment">
          <div class="col-6 text-right">
              text2Memo
            <!-- {{ $t('form.memo') }} -->
          </div>
          <div class="col-6">
              text2Memo
              <slot name="memo"></slot>
          </div>
        </b-row>

        <!-- Datum-->
        <b-row class="gdt-list-row text-header">
          <div class="col-6 text-right">
              text3Date
           <!-- {{ $t('form.date') }} -->
          </div>
          <div class="col-6">
              text3Data
             <!-- <slot name="date"></slot> -->
           </div>
        </b-row>
      </div>

      <b-collapse :id="'a' + date + ''" class="pb-4">
        <b-row class="gdt-list-clooaps-header-text text-center pb-3">
          <div class="col h4"><!--{{ $t('gdt.publisher') }}--> CollapsData</div>
        </b-row>
      </b-collapse>
    </div>
  </div>
</template>
<script>

const iconsByType = {
  1: { icon: 'heart', classes: 'gradido-global-color-accent' },
  4: { icon: 'person-check', classes: 'gradido-global-color-accent' },
  7: { icon: 'gift', classes: 'gradido-global-color-accent' },
}

export default {
  props: {
    date: {
      type: Date,
      default: function () {
        return new Date()
      },
    },
    comment: { type: String, default: '' },
    gdtEntryType: { type: Number, default: '' },
  },
  methods: {
    getIcon(givenType) {
      const type = iconsByType[givenType]
      if (type)
        return {
          icon: type.icon,
          class: type.classes + ' m-mb-1 font2em',
        }
      this.throwError('no icon to given type: ' + givenType)
    },
  },
}
</script>