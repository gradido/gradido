<template>
  <div class="component-overlay">
    <b-jumbotron class="bg-light p-4">
      <template #header>{{ $t('overlay.confirm.title') }}</template>

      <template #lead>
        <b-row class="mt-4">
          <b-col class="col-3">{{ $t('transactionlist.amount') }}</b-col>
          <b-col class="h3">
            <b>{{ item.amount }} {{ $t('GDD') }}</b>
          </b-col>
        </b-row>
        <b-row>
          <b-col class="col-3">{{ $t('creation_for_month') }}</b-col>
          <b-col class="h3">
            {{ $d(new Date(item.date), 'month') }} {{ $d(new Date(item.date), 'year') }}
          </b-col>
        </b-row>
        <b-row>
          <b-col class="col-3">{{ $t('transactionlist.memo') }}</b-col>
          <b-col>{{ item.memo }}</b-col>
        </b-row>
        <b-row class="mt-3">
          <b-col class="col-3">{{ $t('name') }}</b-col>
          <b-col>{{ item.firstName }} {{ item.lastName }}</b-col>
        </b-row>
        <b-row>
          <b-col class="col-3">{{ $t('e_mail') }}</b-col>
          <b-col>{{ item.email }}</b-col>
        </b-row>
      </template>

      <hr class="my-4" />
      <p>{{ $t('overlay.confirm.text') }}</p>
      <p>
        {{ $t('overlay.confirm.question') }}
      </p>
      <b-container>
        <b-row>
          <b-col>
<<<<<<< Updated upstream
            <b-button size="md" variant="danger" class="m-3" @click="$emit('overlay-cancel')">
              {{ $t('overlay.confirm.cancel') }}
=======
            <b-button size="md" variant="info" class="m-3" @click="$emit('overlay-cancel')">
              {{ $t('overlay.cancel') }}
>>>>>>> Stashed changes
            </b-button>
          </b-col>
          <b-col class="text-right">
            <b-button
              size="md"
              variant="success"
              class="m-3 text-right"
              @click="$emit('confirm-creation', item)"
            >
              {{ $t('overlay.confirm.yes') }}
            </b-button>
          </b-col>
        </b-row>
      </b-container>
    </b-jumbotron>
  </div>
</template>
<script>
export default {
  name: 'overlay',
  props: {
    item: { type: Object, required: true },
  },
}
</script>
