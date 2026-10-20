// AI-GENERATED — not an architecture reference
import { BButton, BCard, BCol, BContainer, BRow } from 'bootstrap-vue-next'
import { defineComponent, type PropType, type SlotsType } from 'vue'
import { useI18n } from 'vue-i18n'

export type OverlayItem = {
  amount: string
  contributionDate: string
  memo: string
  user: { firstName: string; lastName: string; emailContact: { email: string } }
}

export const Overlay = defineComponent({
  name: 'Overlay',
  props: {
    item: { type: Object as PropType<OverlayItem>, required: true },
  },
  emits: ['overlay-cancel'],
  slots: Object as SlotsType<{
    title: Record<string, never>
    text: Record<string, never>
    question: Record<string, never>
    'submit-btn': Record<string, never>
  }>,
  setup(props, { emit, slots }) {
    const { t, d } = useI18n()

    return () => (
      <div class='component-overlay'>
        <BCard class='bg-light p-4'>
          <h1 class='display-3'>{slots.title?.({})}</h1>

          {/* <template #lead> */}
          <BRow class='mt-4'>
            <BCol class='col-3'>{t('transactionlist.amount')}</BCol>
            <BCol class='h3'>
              <b>
                {props.item.amount} {t('GDD')}
              </b>
            </BCol>
          </BRow>
          <BRow>
            <BCol class='col-3'>{t('creation_for_month')}</BCol>
            <BCol class='h3'>
              {d(new Date(props.item.contributionDate), 'month')}{' '}
              {d(new Date(props.item.contributionDate), 'year')}
            </BCol>
          </BRow>
          <BRow>
            <BCol class='col-3'>{t('transactionlist.memo')}</BCol>
            <BCol>{props.item.memo}</BCol>
          </BRow>
          <BRow class='mt-3'>
            <BCol class='col-3'>{t('name')}</BCol>
            <BCol>
              {props.item.user.firstName} {props.item.user.lastName}
            </BCol>
          </BRow>
          <BRow>
            <BCol class='col-3'>{t('e_mail')}</BCol>
            <BCol>{props.item.user.emailContact.email}</BCol>
          </BRow>

          <hr class='my-4' />
          {slots.text?.({})}
          {slots.question?.({})}

          <BContainer>
            <BRow>
              <BCol>
                <BButton
                  size='md'
                  variant='info'
                  class='m-3 text-light'
                  onClick={() => emit('overlay-cancel')}
                >
                  {t('overlay.cancel')}
                </BButton>
              </BCol>
              <BCol class='text-end'>{slots['submit-btn']?.({})}</BCol>
            </BRow>
          </BContainer>
        </BCard>
      </div>
    )
  },
})
