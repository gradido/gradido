// AI-GENERATED — not an architecture reference
import { BAvatar, BCol, BCollapse, BRow } from 'bootstrap-vue-next'
import { computed, defineComponent, ref, watch } from 'vue'
import { useI18n } from 'vue-i18n'
import { TransactionCollapse } from '@/components/TransactionCollapse'
import CollapseIcon from '@/components/TransactionRows/CollapseIcon.vue'
import VariantIcon from '@/components/VariantIcon.vue'
import { GdtEntryType } from '@/graphql/enums'
import { useWalletStore } from '@/store/useWalletStore'
import classes from './Transaction.module.scss'

/** One GDT entry: a row of the GDT list that opens on the calculation behind it. */
export const Transaction = defineComponent({
  name: 'Transaction',
  props: {
    amount: Number,
    date: String,
    comment: String,
    gdtEntryType: { type: String, default: GdtEntryType.FORM },
    factor: Number,
    gdt: Number,
    id: Number,
  },
  setup(props) {
    const visible = ref(false)
    const store = useWalletStore()
    const { t, n, d } = useI18n()

    const collapseId = computed(() => `gdt-collapse-${String(props.id)}`)
    const transactionToHighlightId = computed(() => store.transactionToHighlightId)

    const getLinesByType = computed(() => {
      switch (props.gdtEntryType) {
        case GdtEntryType.FORM:
        case GdtEntryType.CVS:
        case GdtEntryType.ELOPAGE:
        case GdtEntryType.DIGISTORE:
        case GdtEntryType.CVS2: {
          return {
            icon: 'heart',
            iconclasses: 'gradido-global-color-accent',
            iconColor: '4',
            description: props.comment, // t('gdt.contribution'),
            descriptiontext: `${n(props.amount as number, 'decimal')} €`,
            credittext: `${n(props.gdt as number, 'decimal')} GDT`,
          }
        }
        case GdtEntryType.ELOPAGE_PUBLISHER: {
          return {
            icon: 'person-check',
            iconclasses: 'gradido-global-color-accent',
            iconColor: '4',
            description: t('gdt.recruited-member'),
            descriptiontext: '5%',
            credittext: `${n(props.amount as number, 'decimal')} GDT`,
          }
        }
        case GdtEntryType.GLOBAL_MODIFICATOR: {
          return {
            icon: 'gift',
            iconclasses: 'gradido-global-color-accent',
            iconColor: '4',
            description: t('gdt.gdt-received'),
            descriptiontext: props.comment,
            credittext: `${n(props.gdt as number, 'decimal')} GDT`,
          }
        }
        default:
          throw new Error(`no lines for this type: ${props.gdtEntryType}`)
      }
    })

    watch(transactionToHighlightId, () => {
      if (parseInt(transactionToHighlightId.value) === props.id) {
        visible.value = true
      }
    })

    return () => {
      const lines = getLinesByType.value
      return (
        <div class={['gdt-transaction-list', classes['gdt-transaction-list']]}>
          <div
            class='list-group bg-white app-box-shadow gradido-border-radius p-3 mb-3'
            onClick={() => {
              visible.value = !visible.value
            }}
          >
            <BRow class='align-items-center'>
              <BCol cols='3' lg='2' md='2'>
                <BAvatar variant='light' size='4em' class={lines.iconclasses}>
                  <VariantIcon icon={lines.icon} variant={lines.iconColor} />
                </BAvatar>
              </BCol>
              <BCol>
                <div>
                  <span class='small'>{d(new Date(props.date as string), 'short')}</span>
                  <span class='small ms-3'>{d(new Date(props.date as string), 'time')}</span>
                </div>
                <div>{lines.description ?? ''}</div>
                <div class='small'>{lines.descriptiontext ?? ''}</div>
              </BCol>
              <BCol cols='8' lg='3' md='3' sm='8' offset='3' offsetMd='0' offsetLg='0'>
                <div class='small mb-2'>{t('gdt.credit')}</div>
                <div class='fw-bold'>{lines.credittext}</div>
              </BCol>
              <BCol cols='12' md='1' lg='1' class='text-end'>
                <CollapseIcon class='text-end' visible={visible.value} />
              </BCol>
            </BRow>

            <BCollapse id={collapseId.value} modelValue={visible.value} class='mt-2'>
              <TransactionCollapse
                amount={props.amount}
                gdtEntryType={props.gdtEntryType}
                factor={props.factor}
                gdt={props.gdt}
              />
            </BCollapse>
          </div>
        </div>
      )
    }
  },
})
