<template>
  <div>
    <div class="container-fluid">
      <gdd-transaction-list
        :transactions="transactions"
        :pageSize="5"
        :timestamp="timestamp"
        :transaction-count="transactionCount"
        :transactionLinkCount="transactionLinkCount"
        :pending="pending"
        @update-transactions="updateTransactions"
        v-on="$listeners"
      />

      <b-card class="mt-5">
        <p class="h2">
          <b-icon icon="exclamation-triangle-fill" variant="warning" class="mr-3"></b-icon>
          Gemeinschaftsumfrage
        </p>
        <b-card-text>
          <b-list-group>
            <b-list-group-item active class="flex-column align-items-start">
              <div class="d-flex w-100 justify-content-between">
                <h3 class="mb-1 text-white">Automatsiche Schöpfung</h3>
                <small>Abstimmungsende in 3 Tagen</small>
              </div>

              <p class="mb-1">
                Hier steht der Beschreibungstext der automatschen Schöpfung, Hier könnte aber auch
                eine andere Umfrage an die Gemeinschaft stehen.
              </p>

              <small>
                Optional! Ein zusätzlicher Text der die Umfrage tiefgründiger erklären kann
              </small>
              <div class="mt-3 d-flex justify-content-end">
                <b-button-group>
                  <b-button variant="danger">Ablehnen</b-button>
                  <b-button variant="secondary">Zustimmen</b-button>
                </b-button-group>
              </div>
            </b-list-group-item>
          </b-list-group>
        </b-card-text>

        <p class="h2 mt-5">
          <b-icon icon="check-square" variant="success" class="mr-3"></b-icon>
          Beschlossene Gemeinschaftsentscheidungen
        </p>
        <b-card-text class="text-dark">
          <b-list-group>
            <b-list-group-item class="flex-column align-items-start">
              <div class="d-flex w-100 justify-content-between">
                <h4 class="mb-1">
                  Automatische Schöpfung für neue Nutzer welche sich über die Documenta Kassel 2022
                  anmelden.
                </h4>
                <small class="text-muted">Gültig seit 18.06.2022</small>
              </div>

              <p class="mb-1">
                Jedes Neue Mitglied bekommt 250 GDD einmalig gutgeschrieben. Jeder Gradido Nutzer
                als Besucher der Austellung erhält einmalig 250 GDD als dankeschön.
              </p>

              <small class="text-muted">Gültig 18.06.2022 bis 01.10.2022</small>
            </b-list-group-item>

            <b-list-group-item class="flex-column align-items-start">
              <div class="d-flex w-100 justify-content-between">
                <h4 class="mb-1">
                  Kinder unter 16 Jahren erhalten automatisch ein monatliches Grundeinkommen.
                </h4>
                <small class="text-muted">Gültig seit 120 Tagen</small>
              </div>

              <p class="mb-1">
                Kinder unter 16 Jahren erhalten Monatlich automatisch 500 GDD Grundeinkommen.
              </p>

              <small class="text-muted">Donec id elit non mi porta.</small>
            </b-list-group-item>
          </b-list-group>
        </b-card-text>

        <p class="h2 mt-5">
          <b-icon icon="x-circle" variant="danger" class="mr-3"></b-icon>
          abgelehnte Gemeinschaftsentscheidungen
        </p>
        <b-card-text class="text-dark">
          <b-list-group>
            <b-list-group-item class="flex-column align-items-start">
              <div class="d-flex w-100 justify-content-between">
                <h4 class="mb-1">List Group item heading</h4>
                <small class="text-muted">01.01.2022</small>
              </div>

              <p class="mb-1">Hier steht der text der Umfrage welcher abgelehnt wurde.</p>

              <small class="text-muted">Gemeinschaftsentscheidungen (2000 / 120)</small>
            </b-list-group-item>
          </b-list-group>
        </b-card-text>
      </b-card>

      <gdd-transaction-list-footer :count="transactionCount" />
    </div>
  </div>
</template>
<script>
import GddTransactionList from '@/components/GddTransactionList.vue'
import GddTransactionListFooter from '@/components/GddTransactionListFooter.vue'

export default {
  name: 'Overview',
  components: {
    GddTransactionList,
    GddTransactionListFooter,
  },
  data() {
    return {
      timestamp: Date.now(),
    }
  },
  props: {
    transactions: {
      default: () => [],
    },
    transactionCount: { type: Number, default: 0 },
    transactionLinkCount: { type: Number, default: 0 },
    pending: {
      type: Boolean,
      default: true,
    },
  },
  methods: {
    updateTransactions(pagination) {
      this.$emit('update-transactions', pagination)
    },
  },
}
</script>
<style>
.g-border {
  border: #ffffff 2px;
  border-style: inset;
  border-radius: 5px;
}
</style>
