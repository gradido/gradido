<template>
  <div>
    <b-jumbotron class="bg-light p-4">
      <template #header>{{ $t('overlay.confirm.title') }}</template>

      <template #lead>
        {{ $t('overlay.confirm.text') }}
        <br />
        <br />
        <b-row>
          <b-col class="col-2">{{ $t('name') }}</b-col>
          <b-col class="h3">{{ items.firstName }} {{ items.lastName }}</b-col>
        </b-row>
        <b-row>
          <b-col class="col-2">{{ $t('e_mail') }}</b-col>
          <b-col class="h3">{{ items.email }}</b-col>
        </b-row>
        <b-row>
          <b-col class="col-2">{{ $t('transactionlist.amount') }}</b-col>
          <b-col class="h3">{{ items.amount }} GDD</b-col>
        </b-row>
        <b-row>
          <b-col class="col-2">{{ $t('transactionlist.memo') }}</b-col>
          <b-col class="h3">{{ items.memo }}</b-col>
        </b-row>
        <b-row>
          <b-col class="col-2">{{ $t('creation_for_month') }}</b-col>
          <b-col class="h3">{{ items.date }}</b-col>
        </b-row>
      </template>

      <hr class="my-4" />

      <p>
        {{ $t('overlay.confirm.question') }}
      </p>
      <b-container>
        <b-row>
          <b-col>
            <b-button size="md" variant="danger" class="m-3" @click="$emit('overlay-cancel')">
              {{ $t('overlay.confirm.cancel') }}
            </b-button>
          </b-col>
          <b-col class="text-right">
            <b-button
              size="md"
              variant="success"
              class="m-3 text-right"
              @click="$emit('overlay-ok', items)"
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
    items: { type: Object, required: true },
  },
}
</script>
