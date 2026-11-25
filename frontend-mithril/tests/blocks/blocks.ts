// AI-GENERATED — not an architecture reference
import m from 'mithril'
import * as v from 'valibot'
import { BusyButton } from '../../src/components/BusyButton'
import { Field } from '../../src/components/Field'
import { Form } from '../../src/components/Form'
import { Pagination } from '../../src/components/Pagination'

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
}

const root = document.getElementById('block')
const block = BLOCKS[location.search.slice(1).split('=')[0]]
if (!root || !block) {
  throw new Error(`no block ${location.search}`)
}
m.mount(root, block)
