// AI-GENERATED — not an architecture reference
import m from 'mithril'
import * as v from 'valibot'
import { BusyButton } from '../../src/components/BusyButton'
import { ConfirmModal } from '../../src/components/ConfirmModal'
import { Field } from '../../src/components/Field'
import { Form } from '../../src/components/Form'
import { Modal } from '../../src/components/Modal'
import { Pagination } from '../../src/components/Pagination'
import { Tabs } from '../../src/components/Tabs'
import { ThemedSelect } from '../../src/components/ThemedSelect'
import { amountSchema } from '../../src/data/Form.schema'
import { setLocale } from '../../src/i18n'

const sendSchema = v.object({
  memo: v.pipe(v.string(), v.minLength(5, 'at least 5 characters')),
  amount: v.pipe(v.string(), v.nonEmpty('amount needed'), v.transform(Number)),
})

// a field another component draws: the form has to find it there too
class AmountRow implements m.ClassComponent {
  view() {
    return m(
      '.row',
      m(Field, { label: 'Amount', name: 'amount', schema: sendSchema.entries.amount }),
    )
  }
}

// `?pagination=5/12/3,7/2/1`: one pager for each `limit/pages/page`
const pagers = (new URLSearchParams(location.search).get('pagination') ?? '')
  .split(',')
  .map((pager) => pager.split('/').map(Number))

const numberSchema = v.object({ amount: amountSchema(10000) })
const amountType = new URLSearchParams(location.search).get('amount')
let sentAmounts: number[] = []
let colour = 'red'
let tab = 0
let asking = false

let sent: v.InferOutput<typeof sendSchema>[] = []
let answer: (() => void) | undefined

const BLOCKS: Record<string, m.Component> = {
  // What was sent is shown as JSON; the answer comes when the spec presses "answer".
  form: {
    view: () => [
      m(
        Form<typeof sendSchema>,
        {
          schema: sendSchema,
          submitBusyButton: m(BusyButton, { class: 'btn-primary' }, 'Send'),
          onsubmit: (values) => {
            sent = [...sent, values]
            return new Promise<void>((resolve) => {
              answer = resolve
            })
          },
        },
        m(Field, { label: 'Memo', name: 'memo', schema: sendSchema.entries.memo }),
        m(AmountRow),
      ),
      m('button', { type: 'button', 'data-test': 'answer', onclick: () => answer?.() }, 'answer'),
      m('pre', { 'data-test': 'sent' }, JSON.stringify(sent)),
    ],
  },
  pagination: {
    view: () =>
      pagers.map((pager) =>
        m(Pagination, {
          limit: pager[0],
          pages: pager[1],
          page: pager[2],
          onpage: (page) => {
            pager[2] = page
          },
        }),
      ),
  },
  // `?amount=text`, as the wallet draws an amount, or `?amount=number`, the browser's own
  amount: {
    view: () => [
      m(
        Form<typeof numberSchema>,
        {
          schema: numberSchema,
          submitBusyButton: m(BusyButton, { class: 'btn-primary' }, 'Send'),
          onsubmit: (values) => {
            sentAmounts = [...sentAmounts, values.amount]
          },
        },
        m(Field, {
          label: 'Amount',
          name: 'amount',
          type: amountType,
          inputmode: 'decimal',
          step: '0.01',
          schema: numberSchema.entries.amount,
        }),
      ),
      m('pre', { 'data-test': 'sent' }, JSON.stringify(sentAmounts)),
    ],
  },
  // a choice between two other buttons, to see where Tab goes
  select: {
    view: () => [
      m('button', { type: 'button' }, 'before'),
      m(ThemedSelect<string>, {
        value: colour,
        options: [
          { value: 'red', text: 'Red' },
          { value: 'green', text: 'Green', disabled: true },
          { value: 'blue', text: 'Blue' },
        ],
        onchange: (value) => {
          colour = value
        },
      }),
      m('button', { type: 'button' }, 'after'),
    ],
  },
  tabs: {
    view: () =>
      m(Tabs, {
        label: 'Bookings',
        active: tab,
        onchange: (index) => {
          tab = index
        },
        tabs: ['Sent', 'Received', 'Open'].map((title) => ({ title, content: `${title} pane` })),
      }),
  },
  // a window whose last button is reached by the arrow keys only (the pager's ›);
  // `?modal=last` with a button after it, `?modal=locked` with a locked one
  modal: {
    view: () => [
      m('button', { type: 'button', onclick: () => (asking = true) }, 'open'),
      asking &&
        m(Modal, { label: 'Pages', onclose: () => (asking = false) }, [
          m('button', { type: 'button' }, 'first'),
          m(Pagination, { limit: 3, pages: 3, page: 1, onpage: () => undefined }),
          location.search.endsWith('=last') && m('button', { type: 'button' }, 'last'),
          location.search.endsWith('=locked') &&
            m('button', { type: 'button', disabled: true, tabindex: 0 }, 'locked'),
        ]),
    ],
  },
  // two windows: what has the focus in the upper one goes
  modals: {
    view: () =>
      m(Modal, { label: 'Lower', onclose: () => undefined }, [
        m('button', { type: 'button' }, 'lower'),
        m(Modal, { label: 'Upper', onclose: () => undefined }, [
          m('button', { type: 'button' }, 'stays'),
          !asking && m('button', { type: 'button', onclick: () => (asking = true) }, 'goes'),
        ]),
      ]),
  },
  confirm: {
    view: () => [
      m('button', { type: 'button', onclick: () => (asking = true) }, 'delete'),
      asking &&
        m(
          ConfirmModal,
          {
            title: 'Delete?',
            yes: 'Delete',
            onyes: () => undefined,
            onclose: () => (asking = false),
          },
          'It cannot be brought back.',
        ),
    ],
  },
}

const root = document.getElementById('block')
const block = BLOCKS[location.search.slice(1).split('=')[0]]
if (!root || !block) {
  throw new Error(`no block ${location.search}`)
}
// the wallet in the language of the browser, which a spec sets (`locale`)
setLocale(navigator.language).then(() => m.mount(root, block))
