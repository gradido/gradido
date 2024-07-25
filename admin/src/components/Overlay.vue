<template>
  <div class="component-overlay">
    <BCard class="bg-light p-4">
      <h1 class="display-3"><slot name="title" /></h1>

      <!--      <template #lead>-->
      <BRow class="mt-4">
        <BCol class="col-3">{{ $t('transactionlist.amount') }}</BCol>
        <BCol class="h3">
          <b>{{ item.amount }} {{ $t('GDD') }}</b>
        </BCol>
      </BRow>
      <BRow>
        <BCol class="col-3">{{ $t('creation_for_month') }}</BCol>
        <BCol class="h3">
          {{ $d(new Date(item.contributionDate), 'month') }}
          {{ $d(new Date(item.contributionDate), 'year') }}
        </BCol>
      </BRow>
      <BRow>
        <BCol class="col-3">{{ $t('transactionlist.memo') }}</BCol>
        <BCol>{{ item.memo }}</BCol>
      </BRow>
      <BRow class="mt-3">
        <BCol class="col-3">{{ $t('name') }}</BCol>
        <BCol>{{ item.firstName }} {{ item.lastName }}</BCol>
      </BRow>
      <BRow>
        <BCol class="col-3">{{ $t('e_mail') }}</BCol>
        <BCol>{{ item.email }}</BCol>
      </BRow>

      <hr class="my-4" />
      <slot name="text" />
      <slot name="question" />

      <BContainer>
        <BRow>
          <BCol>
            <BButton
              size="md"
              variant="info"
              class="m-3 text-light"
              @click="$emit('overlay-cancel')"
            >
              {{ $t('overlay.cancel') }}
            </BButton>
          </BCol>
          <BCol class="text-right">
            <slot name="submit-btn" />
          </BCol>
        </BRow>
      </BContainer>
    </BCard>
  </div>
</template>
<script>
export default {
  name: 'Overlay',
  props: {
    item: { type: Object, required: true },
  },
  emits: ['overlay-cancel'],
}
</script>
