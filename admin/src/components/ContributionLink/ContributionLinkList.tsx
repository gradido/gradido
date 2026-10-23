// AI-GENERATED — not an architecture reference
import { useMutation } from '@vue/apollo-composable'
import {
  BButton,
  BCard,
  BCardText,
  BModal,
  BTable,
  type TableFieldRaw,
  useModal,
} from 'bootstrap-vue-next'
import { computed, defineComponent, type PropType, ref } from 'vue'
import { useI18n } from 'vue-i18n'
import { useIsAdmin } from '@/composables/useIsAdmin'
import { useAppToast } from '@/composables/useToast'
import { CONFIG } from '@/config'
import { deleteContributionLink } from '@/graphql/deleteContributionLink'
import { renderQrCodeCanvas } from '@/utils/qrCode'
import { chequeFileName, drawCheque } from '@/utils/thankYouCheque'
import IBiDownload from '~icons/bi/download'
import IBiEye from '~icons/bi/eye'
import IBiPencil from '~icons/bi/pencil'
import IBiTrash from '~icons/bi/trash'
import { FigureQrCode } from '../FigureQrCode'

export type ContributionLinkRow = {
  id: number | string
  name: string
  memo: string
  amount: string
  validFrom?: string | null
  validTo?: string | null
  link: string
}

type CellScope = { item: ContributionLinkRow }

export const ContributionLinkList = defineComponent({
  name: 'ContributionLinkList',
  props: {
    items: {
      type: Array as PropType<ContributionLinkRow[]>,
      required: true,
    },
  },
  emits: ['close-contribution-form', 'get-contribution-links', 'edit-contribution-link-data'],
  setup(props, { emit }) {
    const isAdmin = useIsAdmin()

    const qrLinkModal = ref(false)
    const { show: showQrCodeModal } = useModal('qr-link-modal')

    const deleteLinkModal = ref(false)
    const { show: showDeleteLinkModal } = useModal('delete-link-modal')

    const { t, d } = useI18n()
    const { toastError, toastSuccess } = useAppToast()

    const modalData = ref<Partial<ContributionLinkRow>>({})

    // The one place where a validity date of a contribution link becomes a Date. The
    // backend sends an instant (a datetime column, serialized as UTC), while a validity
    // reads like a calendar day, so a browser behind UTC shows the day before. Whether
    // that is worth changing is a question for the whole admin, not for one view - and
    // until it is answered, the table and the printed cheque must at least be wrong in
    // the same way. That is what this function is for: one line to change, one answer.
    const validityDate = (value: string) => new Date(value)

    // Every column under a translated head: on a phone a stacked cell shows it as its name, and
    // at the desk the heads were English ("Amount", "Memo"). The four buttons of a row share
    // one column; four columns of them made the table 85.5px wider than a 1024px window
    // (measured 23.10.2026).
    const fields = computed<TableFieldRaw<ContributionLinkRow>[]>(() => [
      { key: 'name', label: t('contributionLink.name') },
      { key: 'memo', label: t('contributionLink.memo') },
      { key: 'amount', label: t('contributionLink.amount') },
      { key: 'cycle', label: t('contributionLink.cycle') },
      { key: 'maxPerCycle', label: t('contributionLink.maxPerCycle') },
      {
        key: 'validFrom',
        label: t('contributionLink.validFrom'),
        formatter: (value) => (value ? d(validityDate(value as string)) : ''),
      },
      {
        key: 'validTo',
        label: t('contributionLink.validTo'),
        formatter: (value) => (value ? d(validityDate(value as string)) : ''),
      },
      { key: 'actions', label: t('actions') },
    ])

    const { mutate: deleteContributionLinkMutation } = useMutation(deleteContributionLink)

    const itemToBeDeleted = ref<Partial<ContributionLinkRow>>({})

    const handleDelete = async (dataPayload: CellScope) => {
      itemToBeDeleted.value = { ...dataPayload.item }
      showDeleteLinkModal()
    }

    const executeDelete = async () => {
      try {
        await deleteContributionLinkMutation({ id: parseInt(String(itemToBeDeleted.value.id)) })
        toastSuccess(t('contributionLink.deleted'))
        emit('close-contribution-form')
        emit('get-contribution-links')
        itemToBeDeleted.value = {}
      } catch (err) {
        toastError((err as Error).message)
      }
    }

    const editContributionLink = (row: ContributionLinkRow) => {
      emit('edit-contribution-link-data', row)
    }

    const showContributionLink = (row: ContributionLinkRow) => {
      modalData.value = row
      showQrCodeModal()
    }

    // The sentence names both ends of the validity, so it can only be printed when both
    // dates are set. A link without them runs open ended, and a cheque that says nothing
    // about validity is closer to the truth than one that prints half a sentence.
    const validLine = ({ validFrom, validTo }: ContributionLinkRow) =>
      validFrom && validTo
        ? t('thank-you-cheque.starting-credit-valid', {
            from: d(validityDate(validFrom), 'short'),
            to: d(validityDate(validTo), 'short'),
          })
        : ''

    // Turns a contribution link into the printable starting bonus cheque. The QR code is
    // rendered off screen because this button sits in the table row, where the modal with
    // the code on it is closed.
    const downloadCheque = async (row: ContributionLinkRow) => {
      try {
        // A variable rather than an inline object: the JSDoc of drawCheque does not list
        // `community`, which it does read for the header.
        const cheque = {
          kind: 'startingBonus' as const,
          community: CONFIG.COMMUNITY_NAME,
          headline: t('thank-you-cheque.starting-credit', { amount: row.amount }),
          memo: row.memo,
          hintLine: t('thank-you-cheque.scan-qr'),
          validLine: validLine(row),
          qrCanvas: await renderQrCodeCanvas(row.link),
        }
        const image = await drawCheque(cheque)
        const anchor = document.createElement('a')
        anchor.href = image
        anchor.download = chequeFileName(row.name, row.amount)
        anchor.click()
      } catch (error) {
        // The cheque is drawn on click, from pictures the wallet serves. If one of them
        // fails to load, that must not stay silent.
        toastError((error as Error).message)
      }
    }

    return () => (
      <div class='contribution-link-list'>
        {/* Below 1200px the cells of a link stand under each other, each under the name of its
            column; from there on the table. ⛔ `xl`, not the `lg` of the other tables: with its
            eight columns the table still stood 13.6px past a 1024px window (the head
            "Wiederholungen" is one word, and a name of a link is long), measured in the built
            admin, 23.10.2026. The names stand in every cell, and the library shows them only
            while the table stacks. */}
        <BTable items={props.items} fields={fields.value} striped hover stacked='xl' labelStacked>
          {{
            // Side by side, at the desk as on a phone. Each button is a symbol and nothing else,
            // so its name is all a screen reader has of it, and its tooltip the moderator's.
            // Only administrators may change a starting balance: a moderator gets the two that
            // reveal and print the link.
            'cell(actions)': (data: CellScope) => (
              <span class='text-nowrap'>
                {isAdmin.value ? (
                  <BButton
                    variant='danger'
                    size='md'
                    class='me-2 test-delete-link'
                    title={t('delete')}
                    aria-label={t('delete')}
                    onClick={() => handleDelete(data)}
                  >
                    <IBiTrash />
                  </BButton>
                ) : null}
                {isAdmin.value ? (
                  <BButton
                    variant='success'
                    size='md'
                    class='me-2 test-edit-link'
                    title={t('edit')}
                    aria-label={t('edit')}
                    onClick={() => editContributionLink(data.item)}
                  >
                    <IBiPencil />
                  </BButton>
                ) : null}
                <BButton
                  variant='info'
                  size='md'
                  class='me-2 test-show'
                  title={t('contributionLink.show')}
                  aria-label={t('contributionLink.show')}
                  onClick={() => showContributionLink(data.item)}
                >
                  <IBiEye />
                </BButton>
                <BButton
                  variant='secondary'
                  size='md'
                  class='test-download-cheque'
                  title={t('thank-you-cheque.download')}
                  aria-label={t('thank-you-cheque.download')}
                  onClick={() => downloadCheque(data.item)}
                >
                  <IBiDownload />
                </BButton>
              </span>
            ),
          }}
        </BTable>

        {modalData.value ? (
          <BModal id='qr-link-modal' v-model={qrLinkModal.value} okOnly noHeaderClose>
            <BCard headerTag='header' footerTag='footer'>
              {{
                header: () => <h6 class='mb-0'>{modalData.value ? modalData.value.name : ''}</h6>,
                default: () => (
                  <BCardText>
                    {modalData.value.memo ? modalData.value.memo : ''}{' '}
                    {/* ⚠️ undefined until a row was shown: modalData starts as {}, which counts as set */}
                    <FigureQrCode link={(modalData.value ? modalData.value.link : '') as string} />
                  </BCardText>
                ),
                footer: () => <em>{modalData.value ? modalData.value.link : ''}</em>,
              }}
            </BCard>
          </BModal>
        ) : null}
        <BModal id='delete-link-modal' v-model={deleteLinkModal.value} onOk={executeDelete}>
          {t('contributionLink.deleteNow', { name: itemToBeDeleted.value.name })}
        </BModal>
      </div>
    )
  },
})
