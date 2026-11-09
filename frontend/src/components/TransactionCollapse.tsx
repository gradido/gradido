// AI-GENERATED — not an architecture reference
import { BCol, BRow } from 'bootstrap-vue-next'
import { computed, defineComponent } from 'vue'
import { useI18n } from 'vue-i18n'
import { GdtEntryType } from '@/graphql/enums'

/** The calculation behind a GDT entry, opened under its row. */
export const TransactionCollapse = defineComponent({
  name: 'TransactionCollapse',
  props: {
    amount: { type: Number },
    gdtEntryType: { type: String, default: GdtEntryType.FORM },
    factor: { type: Number },
    gdt: { type: Number },
  },
  setup(props) {
    const { t, n } = useI18n()

    const getLinesByType = computed(() => {
      switch (props.gdtEntryType) {
        case GdtEntryType.FORM:
        case GdtEntryType.CVS:
        case GdtEntryType.ELOPAGE:
        case GdtEntryType.DIGISTORE:
        case GdtEntryType.CVS2: {
          return {
            headline: t('gdt.calculation'),
            first: t('gdt.factor'),
            firstMath: `${props.factor} GDT pro €`,
            second: t('gdt.formula'),
            secondMath: `${n(props.amount as number, 'decimal')} € * ${props.factor} GDT / € = ${n(props.gdt as number, 'decimal')} GDT`,
          }
        }
        case GdtEntryType.ELOPAGE_PUBLISHER: {
          return {
            headline: t('gdt.publisher'),
            first: null,
            firstMath: null,
            second: null,
            secondMath: null,
          }
        }
        case GdtEntryType.GLOBAL_MODIFICATOR: {
          return {
            headline: t('gdt.conversion-gdt-euro'),
            first: t('gdt.raise'),
            firstMath: `${(props.factor as number) * 100} % `,
            second: t('gdt.conversion'),
            secondMath: `${n(props.amount as number, 'decimal')} GDT * ${(props.factor as number) * 100} % = ${n(props.gdt as number, 'decimal')} GDT`,
          }
        }
        default:
          throw new Error(`no additional transaction info for this type: ${props.gdtEntryType}`)
      }
    })

    return () => {
      const lines = getLinesByType.value
      return (
        <div class='gdt-transaction-collapse py-4 mb-4 gradido-no-border'>
          <BRow class='gdt-list-collapse-header-text mb-3'>
            <BCol class='collapse-headline'>
              <b>{lines.headline}</b>
            </BCol>
          </BRow>
          <BRow class='gdt-list-collapse-box--all'>
            <BCol cols='12' lg='4' md='4'>
              <div class='collapse-first'>{lines.first ?? ''}</div>
              <div class='collapse-second'>{lines.second ?? ''}</div>
            </BCol>
            <BCol offset='1' offsetMd='0' offsetLg='0'>
              <div class='collapse-firstMath'>{lines.firstMath ?? ''}</div>
              <div class='collapse-secondMath'>{lines.secondMath ?? ''}</div>
            </BCol>
          </BRow>
        </div>
      )
    }
  },
})
