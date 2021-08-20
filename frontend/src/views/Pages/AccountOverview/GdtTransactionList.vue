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
        <gdt-event :date="date" :comment="comment" v-if="gdtEntryType === 7">
          <template v-slot:action>{{ comment }}</template>
          <template v-slot:credit>{{ $n(gdt, 'decimal') }} GDT</template>
          <template v-slot:memo>{{ comment }}</template>
          <template v-slot:date>
            {{ $d($moment(date), 'long') }} {{ $i18n.locale === 'de' ? 'Uhr' : '' }}
          </template>
          <!--collaps-->
          <template v-slot:factor>{{ factor * 100 }} %</template>
          <template v-slot:factor-amount>
            {{ $n(amount, 'decimal') }} GDT * {{ factor * 100 }} % = {{ $n(gdt, 'decimal') }} GDT
          </template>
        </gdt-event>

        <gdt-publisher :date="date" :comment="comment" v-else-if="gdtEntryType === 4">
          <template v-slot:your-share>5%</template>
          <template v-slot:credit>{{ $n(amount, 'decimal') }} GDT</template>
          <template v-slot:memo v-if="comment">{{ comment }}</template>
          <template v-slot:date>
            {{ $d($moment(date), 'long') }} {{ $i18n.locale === 'de' ? 'Uhr' : '' }}
          </template>
        </gdt-publisher>

        <gdt-only :date="date" :comment="comment" v-else>
          <template v-slot:contribution>{{ $n(amount, 'decimal') }} €</template>
          <template v-slot:credit>{{ $n(gdt, 'decimal') }} GDT</template>
          <template v-slot:memo>{{ comment }}</template>
          <template v-slot:date>
            {{ $d($moment(date), 'long') }} {{ $i18n.locale === 'de' ? 'Uhr' : '' }}
          </template>
          <!--collaps-->
          <template v-slot:factor>{{ factor }} GDT pro €</template>
          <template v-slot:formula>
            {{ $n(amount, 'decimal') }} € * {{ factor }} GDT / € = {{ $n(gdt, 'decimal') }} GDT
          </template>
        </gdt-only>
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
import GdtEvent from '../../../components/transactions/GdtEvent'
import GdtOnly from '../../../components/transactions/GdtOnly'
import GdtPublisher from '../../../components/transactions/GdtPublisher'

export default {
  name: 'gdt-transaction-list',
  components: {
    PaginationButtons,
    GdtEvent,
    GdtOnly,
    GdtPublisher,
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
