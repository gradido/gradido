// AI-GENERATED — not an architecture reference
import { CONFIG } from '@admin/config'
import { renderQrCodeCanvas } from '@admin/utils/qrCode'
import { chequeFileName, drawCheque } from '@admin/utils/thankYouCheque'
import m, { type ClassComponent, type Vnode } from 'mithril'
import { type Field, Table } from '@/components/bootstrap/Table'
import { toastError } from '@/components/Toasts'
import type { ContributionLink } from '@/data/ContributionLink.schema'
import { d, t } from '@/i18n'
import downloadIcon from '~icons/bi/download'
import eyeIcon from '~icons/bi/eye'
import pencilIcon from '~icons/bi/pencil'
import trashIcon from '~icons/bi/trash'

interface Attrs {
  links: ContributionLink[]
  /** Only administrators may change a starting balance; moderators show and print the links. */
  isAdmin: boolean
  ondelete: (link: ContributionLink) => void
  onedit: (link: ContributionLink) => void
  onshow: (link: ContributionLink) => void
}

// The one place where a validity of a link becomes a Date. The server sends an instant (UTC),
// while a validity reads like a day, so a browser behind UTC shows the day before; table and
// cheque at least have to be wrong in the same way, as in the old admin.
const validityDate = (value: string) => new Date(value)

// The sentence names both ends of the validity: without both it is not printed at all.
const validLine = ({ validFrom, validTo }: ContributionLink) =>
  validFrom && validTo
    ? t('thank-you-cheque.starting-credit-valid', {
        from: d(validityDate(validFrom)),
        to: d(validityDate(validTo)),
      })
    : ''

/**
 * Draws the printable starting bonus cheque of `link` and hands it to the browser as a download.
 * The QR code is drawn off screen: the modal that shows it is closed while this row is clicked.
 */
const downloadCheque = async (link: ContributionLink) => {
  try {
    const image = await drawCheque({
      kind: 'startingBonus',
      community: CONFIG.COMMUNITY_NAME,
      headline: t('thank-you-cheque.starting-credit', { amount: link.amount }),
      memo: link.memo,
      hintLine: t('thank-you-cheque.scan-qr'),
      validLine: validLine(link),
      qrCanvas: await renderQrCodeCanvas(link.link),
    })
    const anchor = document.createElement('a')
    anchor.href = image
    anchor.download = chequeFileName(link.name, link.amount)
    anchor.click()
  } catch (error) {
    // the pictures of the cheque come from the wallet; one that does not load must not stay silent
    toastError((error as Error).message)
  }
}

// a button that is a symbol and nothing else: its name is all a screen reader has of it
const iconButton = (
  variant: string,
  testClass: string,
  name: string,
  icon: string,
  onclick: () => void,
) =>
  m(
    'button.btn.btn-md',
    {
      type: 'button',
      class: `btn-${variant} ${testClass}`,
      title: name,
      'aria-label': name,
      onclick,
    },
    m.trust(icon),
  )

const validity = (value: string | null) => (value ? d(validityDate(value)) : '')

export class ContributionLinkList implements ClassComponent<Attrs> {
  view({ attrs: { links, isAdmin, ondelete, onedit, onshow } }: Vnode<Attrs>) {
    const fields: Field<ContributionLink>[] = [
      { key: 'name', label: t('contributionLink.name') },
      { key: 'memo', label: t('contributionLink.memo') },
      { key: 'amount', label: t('contributionLink.amount') },
      { key: 'cycle', label: t('contributionLink.cycle') },
      { key: 'maxPerCycle', label: t('contributionLink.maxPerCycle') },
      {
        key: 'validFrom',
        label: t('contributionLink.validFrom'),
        cell: (link) => validity(link.validFrom),
      },
      {
        key: 'validTo',
        label: t('contributionLink.validTo'),
        cell: (link) => validity(link.validTo),
      },
      {
        key: 'actions',
        label: t('actions'),
        cell: (link) =>
          m('span.text-nowrap', [
            isAdmin
              ? iconButton('danger', 'me-2 test-delete-link', t('delete'), trashIcon, () =>
                  ondelete(link),
                )
              : null,
            isAdmin
              ? iconButton('success', 'me-2 test-edit-link', t('edit'), pencilIcon, () =>
                  onedit(link),
                )
              : null,
            iconButton('info', 'me-2 test-show', t('contributionLink.show'), eyeIcon, () =>
              onshow(link),
            ),
            iconButton(
              'secondary',
              'test-download-cheque',
              t('thank-you-cheque.download'),
              downloadIcon,
              () => downloadCheque(link),
            ),
          ]),
      },
    ]
    // Below 1200px the cells of a link stand under each other: with its eight columns the table
    // stood past a 1024px window (old admin, measured 23.10.2026).
    return m(
      '.contribution-link-list',
      m(Table<ContributionLink>, {
        rows: links,
        fields,
        class: 'table-hover b-table-stacked-xl table-striped',
      }),
    )
  }
}
