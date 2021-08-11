<template>
  <div class="gdt-transaction-list">
    <b-list-group>
      <b-list-group-item v-if="transactionGdtCount === 0">
        {{ $t('gdt.no-transactions') }}
      </b-list-group-item>
      <b-list-group-item
        v-for="{
          id,
          amount,
          date,
          /*email,*/
          comment,
          /*coupon_code,*/
          gdt_entry_type_id,
          factor,
          /*amount2,*/
          /*factor2,*/
          gdt,
        } in this.transactionsGdt"
        :key="id"
      >
        <!-- ROW Start -->
        <div class="d-flex gdt-transaction-list-item" v-b-toggle="'a' + date + ''">
          <!-- ICON -->
          <div style="width: 8%"></div>
          <!-- Text Links -->
          <div class="font1_2em pr-2 text-right" style="width: 36%">
            <div>
              <div>
                <div v-if="gdt_entry_type_id === 7">{{ $n(gdt, 'decimal') }}</div>
                <div v-else>{{ $n(amount, 'decimal') }}</div>
              </div>

              <div v-if="gdt_entry_type_id !== 7 && gdt_entry_type_id !== 4">
                {{ $n(gdt, 'decimal') }}
              </div>
            </div>

            <div v-if="comment">
              <small>
                {{ $t('form.memo') }}
              </small>
            </div>
            <div v-if="date" class="text-sm">
              {{ $t('form.date') }}
            </div>
          </div>
          <!-- Text Rechts -->
          <div class="font1_2em text-left pl-2" style="width: 55%">
            <div>
              <div v-if="gdt_entry_type_id !== 7 && gdt_entry_type_id !== 4">EURO</div>
              <div>GDT</div>
            </div>

            <div v-if="comment">
              <small>
                {{ comment }}
              </small>
            </div>

            <div v-if="date" class="text-sm">
              {{ $d($moment(date), 'long') }} {{ $i18n.locale === 'de' ? 'Uhr' : '' }}
            </div>
          </div>
          <!-- Collaps Toggle Button -->
          <div v-if="gdt_entry_type_id" class="text-right" style="width: 5%">
            <b-button class="btn-sm">
              <b>i</b>
            </b-button>
          </div>
        </div>
        <!-- ROW End -->
        <!-- Collaps Start -->
        <b-collapse v-if="gdt_entry_type_id" :id="'a' + date + ''" class="pb-4">
          <b-list-group style="border: 0px; background-color: #f1f1f1">
            <div v-if="gdt_entry_type_id !== 7 && gdt_entry_type_id !== 4" class="text-center pt-3">
              {{ $t('gdt.conversion-gdt-euro') }}
            </div>
            <div v-else-if="gdt_entry_type_id === 4" class="text-center pt-3">
              {{ $t('gdt.publisher') }}
            </div>
            <div v-else class="text-center pt-3">
              {{ $t('gdt.calculation') }}
            </div>

            <!--EURO / GDT -->
            <b-list-group-item
              v-if="gdt_entry_type_id !== 7 && gdt_entry_type_id !== 4"
              style="border: 0px; background-color: #f1f1f1"
            >
              <div class="d-flex">
                <div style="width: 40%" class="text-right pr-3 mr-2">
                  <div>{{ $t('gdt.factor') }}</div>
                  <div>{{ $t('gdt.conversion') }}</div>
                </div>
                <div style="width: 60%">
                  <div>{{ factor }}</div>
                  <div>{{ amount }} € * {{ factor }} = {{ $n(gdt, 'decimal') }} GDT</div>
                </div>
              </div>
            </b-list-group-item>

            <b-list-group-item
              v-else-if="gdt_entry_type_id === 4"
              style="border: 0px; background-color: #f1f1f1"
            ></b-list-group-item>

            <!-- Only GDT -->
            <b-list-group-item v-else style="border: 0px; background-color: #f1f1f1">
              <div class="d-flex">
                <div style="width: 40%" class="text-right pr-3 mr-2">{{ $t('gdt.formula') }}:</div>
                <div style="width: 60%">
                  {{ amount }} GDT * {{ factor }} = {{ $n(gdt, 'decimal') }}
                </div>
              </div>
            </b-list-group-item>
          </b-list-group>
        </b-collapse>
        <!-- Collaps End -->
      </b-list-group-item>
    </b-list-group>
  </div>
</template>

<script>
import communityAPI from '../../../apis/communityAPI'

export default {
  name: 'gdt-transaction-list',
  data() {
    return {
      transactionsGdt: { default: () => [] },
      transactionGdtCount: { type: Number, default: 0 },
    }
  },
  methods: {
    async updateGdt() {
      const result = await communityAPI.transactionsgdt(this.$store.state.sessionId)
      if (result.success) {
        this.transactionsGdt = result.result.data.gdtEntries
        this.transactionGdtCount = result.result.data.count
      } else {
        this.$toasted.error(result.result.message)
      }
    },
  },
  mounted() {
    this.updateGdt()
  },
}
</script>
<style>
.el-table .cell {
  padding-left: 0px;
  padding-right: 0px;
}

.nav-tabs .nav-link.active,
.nav-tabs .nav-item.show .nav-link {
  background-color: #f8f9fe38;
}
</style>
