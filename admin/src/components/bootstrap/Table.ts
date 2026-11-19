// AI-GENERATED — not an architecture reference
import m, { type Children, type ClassComponent, type Vnode } from 'mithril'
import './table.css'

/** A column: its head, and how a row fills its cell (the row's value under `key` where not). */
export type Field<Row> = {
  key: string
  label: string
  cell?: (row: Row) => Children
  /** classes of its head and its cells */
  class?: string
}

interface Attrs<Row> {
  rows: Row[]
  fields: Field<Row>[]
  /** e.g. `table-striped table-hover b-table-stacked-xl` */
  class?: string
  /** whether a cell carries the name of its column; on where not set */
  labelStacked?: boolean
  /** names a row for Mithril, which then keeps a row's own state with it as the rows change */
  rowKey?: (row: Row) => string | number
  rowClass?: (row: Row) => string | undefined
  /** what an open row shows below it, across the table; nothing where it is closed */
  details?: (row: Row) => Children | null
}

/**
 * A table of `rows` under the heads of `fields`. A cell carries the name of its column too (where
 * `labelStacked`): a stacked table (`b-table-stacked-<breakpoint>`) shows it in place of the head
 * (table.css).
 */
export class Table<Row extends object> implements ClassComponent<Attrs<Row>> {
  view({
    attrs: { rows, fields, class: classes, labelStacked = true, rowKey, rowClass, details },
  }: Vnode<Attrs<Row>>) {
    return m('table.table.b-table', { class: classes, 'aria-busy': 'false' }, [
      m(
        'thead',
        m(
          'tr',
          fields.map(({ label, class: classes }) =>
            m('th', { scope: 'col', class: classes }, label),
          ),
        ),
      ),
      m(
        'tbody',
        rows.flatMap((row) => {
          const key = rowKey?.(row)
          const shown = details?.(row)
          return [
            m(
              'tr',
              { key, class: rowClass?.(row) },
              fields.map(({ key, label, cell, class: classes }) =>
                m('td', { class: classes }, [
                  labelStacked ? m('label.b-table-stacked-label', label) : null,
                  cell ? cell(row) : String((row as Record<string, unknown>)[key] ?? ''),
                ]),
              ),
            ),
            // a hidden row first, as bootstrap-vue-next had it: the open row keeps the stripe of
            // the row it belongs to
            ...(shown
              ? [
                  m('tr.d-none', {
                    key: `stripe-${key}`,
                    'aria-hidden': 'true',
                    role: 'presentation',
                  }),
                  m('tr', { key: `details-${key}` }, m('td', { colspan: fields.length }, shown)),
                ]
              : []),
          ]
        }),
      ),
    ])
  }
}
