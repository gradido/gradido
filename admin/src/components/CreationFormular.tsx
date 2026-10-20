// AI-GENERATED — not an architecture reference
import { useMutation, useQuery } from '@vue/apollo-composable'
import {
  BButton,
  BForm,
  BFormInput,
  BFormRadioGroup,
  BFormTextarea,
  BInputGroup,
} from 'bootstrap-vue-next'
import { computed, defineComponent, type PropType, ref, watch } from 'vue'
import { useI18n } from 'vue-i18n'
import { useAppToast } from '@/composables/useToast'
import { useAdminStore } from '@/store/useAdminStore'
import { useCreationMonths } from '../composables/useCreationMonths'
import { adminCreateContribution } from '../graphql/adminCreateContribution'
import { adminOpenCreations } from '../graphql/adminOpenCreations'
import classes from './CreationFormular.module.css'

type CreationMonth = {
  short: string
  long?: string
  year: string
  date: string
  creation?: number
}

type CreationMember = {
  userId?: number
  email?: string
}

export const CreationFormular = defineComponent({
  name: 'CreationFormular',
  props: {
    pagetype: {
      type: String,
      required: false,
      default: '',
    },
    item: {
      type: Object as PropType<CreationMember>,
      required: false,
      default: () => ({}),
    },
    items: {
      type: Array,
      required: false,
      default: () => [],
    },
    creationUserData: {
      type: Object as PropType<{ memo?: string; amount?: number }>,
      required: false,
      default: () => ({}),
    },
    // The amounts still open per month; an array, declared as Object as it always was
    creation: {
      type: Object as PropType<number[]>,
      required: true,
    },
  },
  emits: ['update-user-data'],
  setup(props, { emit, expose }) {
    const { creationDateObjects } = useCreationMonths()
    const { toastError, toastSuccess } = useAppToast()
    const { t } = useI18n()
    const store = useAdminStore()

    const text = ref(!props.creationUserData.memo ? '' : props.creationUserData.memo)
    const value = ref(!props.creationUserData.amount ? 0 : props.creationUserData.amount)
    const rangeMin = ref(0)
    const rangeMax = ref(1000)
    const selected = ref<CreationMonth | '' | null>(null)
    const creationForm = ref(null)

    const radioOptions = computed(() => {
      return creationDateObjects.value.map((obj: CreationMonth, idx: number) => {
        return {
          item: { ...obj, creation: props.creation[idx] },
          name: obj.short + (props.creation[idx] ? ` ${props.creation[idx]} GDD` : ''),
        }
      })
    })

    // ⚠️ Checks '' but not null: with an amount and a memo handed in and no month chosen,
    // submit is enabled and fails on the missing month. Kept as it was.
    const disabled = computed(() => {
      return selected.value === '' || value.value <= 0 || text.value.length < 10
    })

    const submitBtnText = computed(() => {
      return props.pagetype === 'PageCreationConfirm'
        ? t('creation_form.update_creation')
        : t('creation_form.submit_creation')
    })

    const updateRadioSelected = (name: CreationMonth) => {
      text.value = `${t('creation_form.creation_for')} ${name?.short} ${name?.year}`
      rangeMin.value = 0
      rangeMax.value = Number(name?.creation)
    }

    const onReset = () => {
      text.value = ''
      value.value = 0
      selected.value = null
    }
    const { mutate: createContribution } = useMutation(adminCreateContribution)

    const { refetch: refetchCreations } = useQuery(adminOpenCreations, {
      userId: props.item.userId,
    })

    const submitCreation = async () => {
      try {
        const result = (await createContribution({
          email: props.item.email,
          creationDate: (selected.value as CreationMonth).date,
          amount: value.value,
          memo: text.value,
        })) as { data: { adminCreateContribution: unknown } }

        emit('update-user-data', props.item, result.data.adminCreateContribution)

        store.openCreationsPlus(1)

        toastSuccess(
          t('creation_form.toasted', {
            value: value.value,
            email: props.item.email,
          }),
        )

        onReset()
      } catch (error) {
        // ES-021: a project account does not create, not through this form either. The server
        // answers with a code; the sentence is ours.
        const message = (error as Error).message
        toastError(
          message?.includes('CREATION_NOT_ALLOWED') ? t('creation_form.not_allowed') : message,
        )
        onReset()
      } finally {
        refetchCreations()
        selected.value = ''
      }
    }

    watch(
      () => selected.value,
      async (newValue, oldValue) => {
        if (newValue !== oldValue && selected.value !== '' && selected.value !== null) {
          updateRadioSelected(newValue as CreationMonth)
        }
      },
    )

    expose({ submitCreation })

    return () => (
      <div class='component-creation-formular'>
        {t('creation_form.form')}{' '}
        <div class='shadow p-3 mb-5 bg-white rounded'>
          <BForm ref={creationForm}>
            <div class='m-4 mt-0'>
              <label>{t('creation_form.select_month')}</label>
              <BFormRadioGroup
                id='radio-group-month-selection'
                v-model={selected.value}
                options={radioOptions.value}
                valueField='item'
                textField='name'
                name='month-selection'
              />
            </div>
            {selected.value ? (
              <div class='m-4 d-flex'>
                <label>{t('creation_form.select_value')}</label>
                <div>
                  <BInputGroup prepend='GDD' append='.00'>
                    <BFormInput
                      v-model={value.value}
                      type='number'
                      min={rangeMin.value}
                      max={rangeMax.value}
                    />
                  </BInputGroup>
                  <BInputGroup
                    prepend='0'
                    append={String(rangeMax.value)}
                    class='mt-3 flex-nowrap align-items-center'
                  >
                    <BFormInput
                      v-model={value.value}
                      type='range'
                      min={rangeMin.value}
                      max={rangeMax.value}
                      step='10'
                    />
                  </BInputGroup>
                </div>
              </div>
            ) : null}
            <div class='m-4'>
              <label>{t('creation_form.enter_text')}</label>
              <div>
                <BFormTextarea
                  id='textarea-state'
                  v-model={text.value}
                  state={text.value.length >= 10}
                  placeholder={t('creation_form.min_characters')}
                  rows='3'
                />
              </div>
            </div>
            <div class={[classes.buttonsWrapper, 'd-flex justify-content-between']}>
              <BButton type='reset' variant='danger' onClick={() => onReset()}>
                {t('creation_form.reset')}
              </BButton>
              <div>
                <BButton
                  type='button'
                  variant='success'
                  class='test-submit'
                  disabled={disabled.value}
                  onClick={submitCreation}
                >
                  {submitBtnText.value}
                </BButton>
              </div>
            </div>
          </BForm>
        </div>
      </div>
    )
  },
})
