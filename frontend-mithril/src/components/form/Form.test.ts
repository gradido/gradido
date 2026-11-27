// AI-GENERATED — not an architecture reference
import { it } from 'bun:test'
import m from 'mithril'
import * as v from 'valibot'
import { BusyButton } from '@/components/ui/BusyButton'
import { Field } from './Field'
import { Form } from './Form'

const sendSchema = v.object({
  memo: v.pipe(v.string(), v.minLength(5, 'at least 5 characters')),
  amount: v.pipe(v.string(), v.transform(Number)),
})

// What the compiler holds: the lines marked must not compile. How the form behaves is held
// in a browser (tests/blocks/form.spec.ts).
it('is typed by its schema', () => {
  // The form knows the values it sends by its schema.
  m(
    Form<typeof sendSchema>,
    {
      schema: sendSchema,
      submitBusyButton: m(BusyButton, { class: 'btn-primary' }, 'Send'),
      onsubmit: (values) => {
        values.amount.toFixed(2)
        // @ts-expect-error the memo is text
        values.memo.toFixed(2)
      },
    },
    [
      m(Field, { label: 'Memo', name: 'memo', schema: sendSchema.entries.memo }),
      m(Field, {
        label: 'Amount',
        name: 'amount',
        schema: sendSchema.entries.amount,
        defaultValue: '1',
      }),
    ],
  )

  // A field that tells the page its value is named with its schema: then `oninput` knows it.
  m(Field<typeof sendSchema.entries.amount>, {
    label: 'Amount',
    name: 'amount',
    schema: sendSchema.entries.amount,
    oninput: (amount) => amount?.toFixed(2),
  })
  m(Field<typeof sendSchema.entries.amount>, {
    label: 'Amount',
    name: 'amount',
    // @ts-expect-error the schema of another field
    schema: sendSchema.entries.memo,
  })
})
