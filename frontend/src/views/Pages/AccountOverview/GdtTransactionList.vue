<template>
  <div class="gdt-transaction-list">
    <div class="list-group">
      <div v-if="transactionGdtCount === 0">
        {{ $t('gdt.no-transactions') }}
      </div>
      <div
        v-else
        v-for="{
          transactionId,
          amount,
          date,
          comment,
          gdtEntryType,
          factor,
          gdt,
        } in transactionsGdt"
        :key="transactionId"
      >
        <div class="list-group-item gdt-transaction-list-item" v-b-toggle="'a' + date + ''">
          <!-- Icon  -->
          <div class="text-right" style="position: absolute">
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

          <!-- 7 nur GDT erhalten -->
          <b-row v-if="gdtEntryType === 7">
            <div class="col-6 text-right">
              <div>{{ $t('gdt.gdt-receive') }}</div>
              <div>{{ $t('gdt.credit') }}</div>
            </div>
            <div class="col-6">
              <div>{{ comment }}</div>
              <div>{{ $n(gdt, 'decimal') }} GDT</div>
            </div>
          </b-row>
          <!--4 publisher -->
          <b-row v-else-if="gdtEntryType === 4">
            <div class="col-6 text-right">
              <div>{{ $t('gdt.your-share') }}</div>
              <div>{{ $t('gdt.credit') }}</div>
            </div>
            <div class="col-6">
              <div>5%</div>
              <div>{{ $n(amount, 'decimal') }} GDT</div>
            </div>
          </b-row>
          <!-- 1, 2, 3, 5, 6 spenden in euro -->
          <b-row v-else>
            <div class="col-6 text-right">
              <div>{{ $t('gdt.contribution') }}</div>
              <div>{{ $t('gdt.credit') }}</div>
            </div>
            <div class="col-6">
              <div>{{ $n(amount, 'decimal') }} €</div>
              <div>{{ $n(gdt, 'decimal') }} GDT</div>
            </div>
          </b-row>

          <!-- Betrag ENDE-->

          <!-- Nachricht-->
          <b-row v-if="comment && gdtEntryType !== 7">
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

        <b-collapse v-if="gdtEntryType" :id="'a' + date + ''" class="pb-4">
          <div style="border: 0px; background-color: #f1f1f1" class="p-2 pb-4 mb-4">
            <!-- Überschrift -->
            <b-row class="gdt-list-clooaps-header-text text-center pb-3">
              <div class="col h4" v-if="gdtEntryType === 7">
                {{ $t('gdt.conversion-gdt-euro') }}
              </div>
              <div class="col h4" v-else-if="gdtEntryType === 4">
                {{ $t('gdt.publisher') }}
              </div>
              <div class="col h4" v-else>{{ $t('gdt.calculation') }}</div>
            </b-row>

            <!-- 7 nur GDT erhalten -->
            <b-row class="gdt-list-clooaps-box-7" v-if="gdtEntryType == 7">
              <div class="col-6 text-right clooaps-col-left">
                <div>{{ $t('gdt.raise') }}</div>
                <div>{{ $t('gdt.conversion') }}</div>
              </div>
              <div class="col-6 clooaps-col-right">
                <div>{{ factor * 100 }} %</div>
                <div>
                  {{ $n(amount, 'decimal') }} GDT * {{ factor * 100 }} % =
                  {{ $n(gdt, 'decimal') }} GDT
                </div>
              </div>
            </b-row>
            <!-- 4 publisher -->
            <b-row class="gdt-list-clooaps-box-4" v-else-if="gdtEntryType === 4">
              <div class="col-6 text-right clooaps-col-left"></div>
              <div class="col-6 clooaps-col-right"></div>
            </b-row>

            <!-- 1, 2, 3, 5, 6 spenden in euro -->
            <b-row class="gdt-list-clooaps-box--all" v-else>
              <div class="col-6 text-right clooaps-col-left">
                <div>{{ $t('gdt.factor') }}</div>
                <div>{{ $t('gdt.formula') }}</div>
              </div>
              <div class="col-6 clooaps-col-right">
                <div>{{ factor }} GDT pro €</div>
                <div>
                  {{ $n(amount, 'decimal') }} € * {{ factor }} GDT / € =
                  {{ $n(gdt, 'decimal') }} GDT
                </div>
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
import { listGDTEntriesQuery } from '../../../graphql/queries'
import PaginationButtons from '../../../components/PaginationButtons'

function iconByType(typeId) {
  switch (typeId) {
    case 1:
    case 2:
    case 3:
    case 5:
    case 6:
      return { icon: 'heart', classes: 'gradido-global-color-accent' }
    case 4:
      return { icon: 'person-check', classes: 'gradido-global-color-accent' }
    case 7:
      return { icon: 'gift', classes: 'gradido-global-color-accent' }
  }
}

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
      this.$apollo
        .query({
          query: listGDTEntriesQuery,
          variables: {
            sessionId: this.$store.state.sessionId,
            currentPage: this.currentPage,
            pageSize: this.pageSize,
          },
        })
        .then((result) => {
          const {
            data: { listGDTEntries },
          } = result
          this.transactionsGdt = listGDTEntries.gdtEntries
          this.transactionGdtCount = listGDTEntries.count
        })
        .catch((error) => {
          this.$toasted.error(error.message)
        })
    },
    getIcon(givenType) {
      const type = iconByType(givenType)
      if (type)
        return {
          icon: type.icon,
          class: type.classes + ' m-mb-1 font2em',
        }
      this.throwError('no icon to given type: ' + givenType)
    },
    throwError(msg) {
      throw new Error(msg)
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
