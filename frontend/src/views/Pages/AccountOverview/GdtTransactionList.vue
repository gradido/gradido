<template>
  <div class="gdt-transaction-list">
    <div class="list-group">
      <div v-if="transactionGdtCount === 0">
        {{ $t('gdt.no-transactions') }}
      </div>
      <div
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
        <div class="list-group-item gdt-transaction-list-item" v-b-toggle="'a' + date + ''">
          <!-- Collaps Button  -->
          <div class="text-right" style="width: 96%; position: absolute">
            <b-button class="btn-sm">
              <b>i</b>
            </b-button>
          </div>

          <!-- Betrag -->

          <!-- 7 nur GDT erhalten -->
          <b-row v-if="gdt_entry_type_id === 7">
            <div class="col-6 text-right">
              <div>{{ $t('gdt.gdt-receive') }}</div>
              <div>Gutschrift</div>
            </div>
            <div class="col-6">
              <div>{{ comment }}</div>
              <div>{{ $n(gdt, 'decimal') }} GDT</div>
            </div>
          </b-row>
          <!--4 publisher -->
          <b-row v-else-if="gdt_entry_type_id === 4">
            <div class="col-6 text-right">
              <div>{{ $t('gdt.your-share') }}</div>
              <div>Gutschrift</div>
            </div>
            <div class="col-6">
              <div>5%</div>
              <div>{{ $n(amount, 'decimal') }} GDT</div>
            </div>
          </b-row>
          <!-- 1, 2, 3, 5, 6 spenden in euro -->
          <b-row v-else>
            <div class="col-6 text-right">
              <div>{{ $t('gdt.donation') }}</div>
              <div>Gutschrift</div>
            </div>
            <div class="col-6">
              <div>{{ $n(amount, 'decimal') }} €</div>
              <div>{{ $n(gdt, 'decimal') }} GDT</div>
            </div>
          </b-row>

          <!-- Betrag ENDE-->

          <!-- Nachricht-->
          <b-row v-if="comment && gdt_entry_type_id !== 7">
            <div class="col-6 text-right">
              {{ $t('form.memo') }}
            </div>
            <div class="col-6">
              {{ comment }}
            </div>
          </b-row>

          <!-- Datum-->
          <b-row v-if="date" class="gdt-list-row text-header">
            <div class="col-6 text-right">
              {{ $t('form.date') }}
            </div>
            <div class="col-6">
              {{ $d($moment(date), 'long') }} {{ $i18n.locale === 'de' ? 'Uhr' : '' }}
            </div>
          </b-row>
        </div>

        <!--     Collaps START    -->

        <b-collapse v-if="gdt_entry_type_id" :id="'a' + date + ''" class="pb-4">
          <div style="border: 0px; background-color: #f1f1f1" class="p-2 pb-4 mb-4">
            <!-- Überschrift -->
            <b-row class="gdt-list-clooaps-header-text text-center pb-3">
              <div class="col h4" v-if="gdt_entry_type_id === 7">
                {{ $t('gdt.conversion-gdt-euro') }}
              </div>
              <div class="col h4" v-else-if="gdt_entry_type_id === 4">
                {{ $t('gdt.publisher') }}
              </div>
              <div class="col h4" v-else>{{ $t('gdt.calculation') }}</div>
            </b-row>

            <!-- 7 nur GDT erhalten -->
            <b-row class="gdt-list-clooaps-box-7" v-if="gdt_entry_type_id == 7">
              <div class="col-6 text-right clooaps-col-left">
                <div>{{ $t('gdt.factor') }}</div>
                <div>{{ $t('gdt.conversion') }}</div>
              </div>
              <div class="col-6 clooaps-col-right">
                <div>{{ factor }}</div>
                <div>{{ amount }} € * {{ factor }} = {{ $n(gdt, 'decimal') }} GDT</div>
              </div>
            </b-row>
            <!-- 4 publisher -->
            <b-row class="gdt-list-clooaps-box-4" v-else-if="gdt_entry_type_id === 4">
              <div class="col-6 text-right clooaps-col-left"></div>
              <div class="col-6 clooaps-col-right"></div>
            </b-row>

            <!-- 1, 2, 3, 5, 6 spenden in euro -->
            <b-row class="gdt-list-clooaps-box--all" v-else>
              <div class="col-6 text-right clooaps-col-left">{{ $t('gdt.formula') }}:</div>
              <div class="col-6 clooaps-col-right">
                {{ amount }} GDT * {{ factor }} = {{ $n(gdt, 'decimal') }}
              </div>
            </b-row>
          </div>
        </b-collapse>
        <!--     Collaps ENDE    -->
      </div>
    </div>
    <pagination-buttons
      v-if="transactionGdtCount > pageSize"
      :has-next="hasNext"
      :has-previous="hasPrevious"
      :total-pages="totalPages"
      :current-page="currentPage"
      @show-next="showNext"
      @show-previous="showPrevious"
    ></pagination-buttons>
  </div>
</template>

<script>
import communityAPI from '../../../apis/communityAPI'
import PaginationButtons from '../../../components/PaginationButtons'

export default {
  name: 'gdt-transaction-list',
  components: {
    PaginationButtons,
  },
  data() {
    return {
      transactionsGdt: { default: () => [] },
      transactionGdtCount: { type: Number, default: 0 },
      currentPage: 1,
      pageSize: 25,
    }
  },
  computed: {
    hasNext() {
      return this.currentPage * this.pageSize < this.transactionGdtCount
    },
    hasPrevious() {
      return this.currentPage > 1
    },
    totalPages() {
      return Math.ceil(this.transactionGdtCount / this.pageSize)
    },
  },
  methods: {
    async updateGdt() {
      const result = await communityAPI.transactionsgdt(
        this.$store.state.sessionId,
        this.currentPage,
        this.pageSize,
      )
      if (result.success) {
        this.transactionsGdt = result.result.data.gdtEntries
        this.transactionGdtCount = result.result.data.count
      } else {
        this.$toasted.error(result.result.message)
      }
    },
    showNext() {
      this.currentPage++
      this.updateGdt()
      window.scrollTo(0, 0)
    },
    showPrevious() {
      this.currentPage--
      this.updateGdt()
      window.scrollTo(0, 0)
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
