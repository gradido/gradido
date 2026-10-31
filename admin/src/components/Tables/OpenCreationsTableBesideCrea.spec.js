// AI-GENERATED — not an architecture reference
import { readFileSync } from 'node:fs'
import { dirname, join } from 'node:path'
import { fileURLToPath } from 'node:url'
import { mount } from '@vue/test-utils'
import { afterEach, describe, expect, it, vi } from 'vitest'
import { adminStore } from '../../../test/adminStore'
import { OpenCreationsTable } from './OpenCreationsTable'

vi.mock('vue-i18n', () => ({
  useI18n: () => ({ t: (key) => key, d: (date) => String(date) }),
}))

const here = dirname(fileURLToPath(import.meta.url))

/**
 * The rule that keeps a row's last button clear of the Crea button, read where it is written, and
 * asked of the REAL table. Its selector leans on what bootstrap-vue-next draws: the table as a child
 * of this component's root, a `colspan` on the cell of an opened row's details. A stub would answer
 * to whatever one wrote into it. jsdom lays nothing out; that the button then stands clear is
 * measured in the built bundle (admin-probe, 31.10.2026).
 */
const selector = readFileSync(join(here, 'OpenCreationsTable.css'), 'utf8')
  .replace(/\/\*[\s\S]*?\*\//g, '')
  .match(/([^{}]*\.beside-crea-chat[^{}]*)\{/)[1]
  .trim()
  .replace(/\s+/g, ' ')

const contribution = (id, extra = {}) => ({
  id,
  amount: '100',
  memo: 'Arbeit im Gemeinschaftsgarten',
  contributionStatus: 'PENDING',
  contributionDate: new Date('2026-08-05T10:00:00.000Z'),
  createdAt: new Date('2026-08-05T10:00:00.000Z'),
  messagesCount: 0,
  user: {
    id: 42,
    firstName: 'Margret',
    lastName: 'von Gradido',
    gradidoID: 'g',
    communityUuid: 'h',
  },
  ...extra,
})

const mountTable = ({ attrs = {}, items = [contribution(1), contribution(2)] } = {}) =>
  mount(OpenCreationsTable, {
    attrs,
    props: {
      items,
      fields: [
        { key: 'memo', label: 'text' },
        { key: 'confirm', label: 'save' },
      ],
      hideResubmission: false,
    },
    global: {
      plugins: [adminStore({ moderator: {} })],
      stubs: {
        BModal: true,
        ContributionMessagesList: true,
        RowDetails: { template: '<div class="details" />' },
      },
    },
  })

describe('the room beside the Crea button', () => {
  let wrapper

  afterEach(() => {
    wrapper?.unmount()
    wrapper = undefined
  })

  it('takes the last cell of every row, the one that holds the save button', () => {
    wrapper = mountTable({ attrs: { class: 'beside-crea-chat' } })
    const cells = [...wrapper.element.querySelectorAll(selector)]
    expect(cells).toHaveLength(2)
    for (const cell of cells) {
      expect(cell).toBe(cell.parentElement.lastElementChild)
      expect(cell.querySelector('button.btn-success')).not.toBeNull()
    }
  })

  it('takes nothing without the class the page hands on', () => {
    wrapper = mountTable()
    expect(wrapper.element.querySelectorAll('td').length).toBeGreaterThan(0)
    expect(wrapper.element.querySelectorAll(selector)).toHaveLength(0)
  })

  it("leaves an opened row's details alone, and a table inside them", () => {
    wrapper = mountTable({
      attrs: { class: 'beside-crea-chat' },
      items: [contribution(1, { _showDetails: true })],
    })
    const details = wrapper.element.querySelector('td[colspan]')
    expect(details).not.toBeNull()
    // A table inside the details, as an opened row's creation form has one.
    details.innerHTML = '<table><tbody><tr><td class="inner">x</td></tr></tbody></table>'
    const cells = [...wrapper.element.querySelectorAll(selector)]
    expect(cells).toHaveLength(1)
    expect(cells[0].hasAttribute('colspan')).toBe(false)
    expect(cells[0].classList.contains('inner')).toBe(false)
  })
})
