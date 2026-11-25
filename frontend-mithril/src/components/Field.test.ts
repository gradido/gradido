// AI-GENERATED — not an architecture reference
import { expect, it } from 'bun:test'
import m from 'mithril'
import * as v from 'valibot'
import { Field } from './Field'

const schema = v.string()
type FieldAttrs = Parameters<Field<typeof schema>['view']>[0]['attrs']

/** The attributes of everything drawn among `children`, by its tag. */
function attrsIn(children: m.Children): [string, m.Attributes][] {
  if (Array.isArray(children)) {
    return children.flatMap(attrsIn)
  }
  if (typeof children !== 'object' || children === null) {
    return []
  }
  return [[String(children.tag), children.attrs ?? {}], ...attrsIn(children.children)]
}

function drawn(attrs: { id?: string; 'data-test'?: string }) {
  // Mithril's types lose what a class component keeps: said here, to hand the vnode to it
  const vnode = m<FieldAttrs, object>(Field<typeof schema>, {
    label: 'Memo',
    name: 'memo',
    schema,
    ...attrs,
  })
  const field = new Field<typeof schema>()
  field.oninit(vnode)
  return attrsIn(field.view(vnode))
}
const of = (all: [string, m.Attributes][], tag: string) =>
  all.filter(([drawnTag]) => drawnTag === tag).map(([, attrs]) => attrs)

it('names its input and its feedback by the name of the field', () => {
  const all = drawn({})
  expect(of(all, 'label')[0].for).toBe('memo-input-field')
  expect(of(all, 'input')[0].id).toBe('memo-input-field')
  expect(of(all, 'input')[0]['aria-describedby']).toBe('memo-feedback')
  expect(all.some(([, attrs]) => attrs.id === 'memo-feedback')).toBe(true)
})

it('takes an id of its own, for two fields of one name on a page', () => {
  const all = drawn({ id: 'answer-memo' })
  expect(of(all, 'label')[0].for).toBe('answer-memo')
  expect(of(all, 'input')[0].id).toBe('answer-memo')
  expect(of(all, 'input')[0]['aria-describedby']).toBe('answer-memo-feedback')
  expect(all.some(([, attrs]) => attrs.id === 'answer-memo-feedback')).toBe(true)
})

it('marks one element for tests, not two', () => {
  const marked = drawn({ 'data-test': 'memo' }).filter(([, attrs]) => attrs['data-test'])
  expect(marked.length).toBe(1)
})
