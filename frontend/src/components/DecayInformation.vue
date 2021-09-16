<template>
  <div>
    <span v-if="decaytyp === 'short'">
      <div v-if="decay.balance > 0">
        {{ decay ? ' -' + decay.balance + ' ' + decayStartBlockTextShort : '' }}
      </div>
      <div v-else>
        {{ $t('decay.noDecay') }}
      </div>
    </span>

    <div v-if="decaytyp === 'new'">
   
      <b-list-group style="border: 0px">
        <b-list-group-item style="border: 0px; background-color: #f1f1f1">
          <div class="d-flex" v-if="!decay.decayStartBlock">
            <div style="width: 100%" class="text-center pb-3">
              <b-icon icon="droplet-half" height="12" class="mb-2" />
              <b>{{ $t('decay.calculation_decay') }}</b>
            </div>
          </div>


          <div class="d-flex">
            <div style="width: 40%" class="text-right pr-3 mr-2">
              <div v-if="!decay.decayStartBlock">{{ $t('decay.last_transaction') }}</div>
            </div>
            <div style="width: 60%">
              <div v-if="decay.decayStartBlock > 0">
                <div class="display-4">{{ $t('decay.Starting_block_decay') }}</div>
                <div>
                  {{ $t('decay.decay_introduced') }} :
                  {{ $d($moment.unix(decay.decayStart), 'long') }}
                </div>
              </div>
              <div>
                <span v-if="!decay.decayStart">
                  {{ $d($moment.unix(decay.decayStart), 'long') }}
                  {{ $i18n.locale === 'de' ? 'Uhr' : '' }}
                </span>
              </div>
            </div>
          </div>

          <div class="d-flex">
            <div style="width: 40%" class="text-right pr-3 mr-2">
              <div v-if="!decay.decayStartBlock">{{ $t('decay.past_time') }}</div>
            </div>
            <div style="width: 60%">
              <div v-if="decay.decayStartBlock > 0">{{ $t('decay.since_introduction') }}</div>
              <span v-if="duration">
                <span v-if="duration.years > 0">{{ duration.years }} {{ $t('decay.year') }},</span>
                <span v-if="duration.months > 0">
                  {{ duration.months }} {{ $t('decay.months') }},
                </span>
                <span v-if="duration.days > 0">{{ duration.days }} {{ $t('decay.days') }},</span>
                <span v-if="duration.hours > 0">{{ duration.hours }} {{ $t('decay.hours') }},</span>
                <span v-if="duration.minutes > 0">
                  {{ duration.minutes }} {{ $t('decay.minutes') }},
                </span>
                <span v-if="duration.seconds > 0">
                  {{ duration.seconds }} {{ $t('decay.seconds') }}
                </span>
              </span>
            </div>
          </div>
          <div v-if="decay.balance > 0">
          <div class="d-flex" >
            <div style="width: 40%" class="text-right pr-3 mr-2">
              <div v-if="type === 'send'">{{ $t('form.amount') }} </div>
              <div v-if="type === 'receive'">{{ $t('form.amount') }} </div>
            </div>
            <div style="width: 60%">
              <div> {{balance}} </div>               
            </div>
          </div>
           <div class="d-flex">
            <div style="width: 40%" class="text-right pr-3 mr-2">
              <div>{{ $t('decay.decay') }}</div>
            </div>
            <div style="width: 60%">
              <div> {{ decay.balance }} </div>               
            </div>
          </div>
          <div class="d-flex">
            <div style="width: 40%" class="text-right pr-3 mr-2">
              <div  v-if="type === 'send'">{{ $t('decay.sent') }}</div>
              <div  v-if="type === 'receive'">{{ $t('decay.received') }}</div>
            </div>
            <div style="width: 60%">
              <div v-if="type === 'send'"><b> {{ parseInt(balance) + decay.balance  }} </b></div>               
              <div v-if="type === 'receive'"><b> {{ parseInt(balance) - decay.balance  }} </b></div>
            </div>
          </div>
          </div>
        </b-list-group-item>
      </b-list-group>
    </div>
  </div>
</template>
<script>
export default {
  name: 'DecayInformation',
  props: {
    balance: { type: String, default: '' },
    type: { type: String, default: '' },
    decay: {
      balance: '',
      decayDuration: '',
      decayStart: 0,
      decayEnd: 0,
      decayStartBlock: 0,
    },
    decaytyp: { type: String, default: '' },
  },
  computed: {
    decayStartBlockTextShort() {
      return this.decay.decayStartBlock
        ? this.$t('decay.decayStart') + this.$d(this.$moment.unix(this.decay.decayStartBlock))
        : ''
    },
    duration() {
      return this.$moment.duration(
        this.$moment
          .unix(new Date(this.decay.decayEnd))
          .diff(this.$moment.unix(new Date(this.decay.decayStart))),
      )._data
    },
  },
}
</script>
