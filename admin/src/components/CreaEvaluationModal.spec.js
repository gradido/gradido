import { mount } from '@vue/test-utils'
import { describe, it, expect, beforeEach, vi } from 'vitest'
import { nextTick } from 'vue'
import CreaEvaluationModal from './CreaEvaluationModal.vue'
import { useMutation, useApolloClient } from '@vue/apollo-composable'

// This file exists because the [ANREDE] fill moved OUT of the tested backend and INTO
// this component. Without it the salutation handling had no test on either side of the
// wire: the backend stopped substituting the placeholder and nothing checked that anyone
// else did. The leak these tests pin actually shipped once - a rewrite rendered the draft
// with the typed salutation instead of the effective one, so a participant would have
// received a reply literally beginning "[ANREDE],".

vi.mock('@vue/apollo-composable')
vi.mock('vue-i18n', () => ({
  useI18n: () => ({ t: (key) => key, locale: { value: 'de' } }),
}))
vi.mock('@/composables/useToast', () => ({
  useAppToast: () => ({ toastSuccess: vi.fn(), toastError: vi.fn() }),
}))
vi.mock('@/composables/useCreaSound', () => ({
  primeCreaSound: vi.fn(),
  playCreaSound: vi.fn(),
}))

const SALUTATION_PLACEHOLDER = '[ANREDE]'
const SIGNATURE_PLACEHOLDER = '[SIGNATUR]'
// What Crea returns: both placeholders intact, for the browser to fill.
const RAW_REPLY = `${SALUTATION_PLACEHOLDER},\n\nvielen Dank.\n\n${SIGNATURE_PLACEHOLDER}`

const contribution = (over = {}) => ({
  id: 1,
  userId: 42,
  memo: 'Ich habe im Tierheim geholfen.',
  amount: 200,
  contributionDate: '2026-07-01',
  user: { firstName: 'Thomas', lastName: 'Muster', salutation: null },
  ...over,
})

// The modal is permanently mounted and starts working on the BModal "shown" event, so the
// tests drive it the same way the moderator does: open, then act.
const stubs = {
  BModal: {
    name: 'BModal',
    template: '<div><slot /></div>',
    emits: ['shown', 'hidden'],
  },
}

describe('CreaEvaluationModal — salutation', () => {
  let mutate
  let rewriteResult

  const mountModal = (over = {}) =>
    mount(CreaEvaluationModal, {
      props: { contribution: contribution(over) },
      global: { stubs },
    })

  // Opens the modal and lets the evaluation settle.
  const open = async (wrapper) => {
    wrapper.findComponent({ name: 'BModal' }).vm.$emit('shown')
    await new Promise((resolve) => setTimeout(resolve, 0))
    await nextTick()
  }

  beforeEach(() => {
    rewriteResult = { responseText: RAW_REPLY, memoSupplement: null }
    mutate = vi.fn(async () => ({
      data: {
        creaEvaluateContribution: {
          responseText: RAW_REPLY,
          defaultSalutation: 'Lieber Thomas',
          overallVerdict: 'confirm',
          flags: [],
          activities: [],
          openPoints: [],
        },
        creaRewriteResponse: rewriteResult,
      },
    }))
    useMutation.mockReturnValue({ mutate })
    // No sibling contributions: the single-contribution path, and no fresh salutation.
    useApolloClient.mockReturnValue({
      resolveClient: () => ({
        query: vi.fn(async () => ({ data: { adminListContributions: { contributionList: [] } } })),
      }),
    })
  })

  it('fills the placeholder from the name heuristic when nothing is stored', async () => {
    const wrapper = mountModal()
    await open(wrapper)
    expect(wrapper.vm.responseText).toContain('Lieber Thomas')
    expect(wrapper.vm.responseText).not.toContain(SALUTATION_PLACEHOLDER)
  })

  // The regression this file was written for. A rewrite must render with the SAME
  // salutation as the first draft; rendering it with the (empty) input field instead
  // leaves the raw placeholder in a reply the moderator then sends.
  it('keeps the placeholder filled after a rewrite for another decision', async () => {
    const wrapper = mountModal()
    await open(wrapper)
    wrapper.vm.chosenDecision = 'deny'
    await nextTick()
    await wrapper.vm.rewriteForDecision()
    await nextTick()
    expect(wrapper.vm.responseText).not.toContain(SALUTATION_PLACEHOLDER)
    expect(wrapper.vm.responseText).toContain('Lieber Thomas')
  })

  // Once the draft has been rendered any other way, the watcher's "did the moderator
  // hand-edit this?" guard stops matching and the field goes dead for the rest of the
  // session. That is why the rewrite above has to go through the same render path.
  it('still follows the salutation field after a rewrite', async () => {
    const wrapper = mountModal()
    await open(wrapper)
    wrapper.vm.chosenDecision = 'deny'
    await nextTick()
    await wrapper.vm.rewriteForDecision()
    await nextTick()
    wrapper.vm.salutation = 'Hallo Tom'
    await nextTick()
    expect(wrapper.vm.responseText).toContain('Hallo Tom')
    expect(wrapper.vm.responseText).not.toContain(SALUTATION_PLACEHOLDER)
  })

  it('falls back to the heuristic when the moderator empties the field', async () => {
    const wrapper = mountModal({ user: { firstName: 'Thomas', salutation: 'Lieber Tom' } })
    await open(wrapper)
    wrapper.vm.salutation = ''
    await nextTick()
    expect(wrapper.vm.responseText).toContain('Lieber Thomas')
    expect(wrapper.vm.responseText).not.toContain(SALUTATION_PLACEHOLDER)
  })

  // The counterpart of the backend's own placeholder test. The two packages hand this
  // literal to each other and neither can import the other's copy, so both pin it: change
  // one without the other and a test fails instead of a participant getting "[ANREDE],".
  it('expects exactly the placeholders the backend emits', async () => {
    const wrapper = mountModal()
    await open(wrapper)
    expect(wrapper.vm.responseText).toContain(SIGNATURE_PLACEHOLDER)
    expect(RAW_REPLY).toContain('[ANREDE]')
  })
})

// The batch checklist splits by resubmission (E-026): untouched contributions on top and
// preselected, everything already put off below and unticked. "Put off" means here what it
// means behind the modal - a date still ahead - so a date that has passed moves the
// contribution back up into its own group instead of hiding among the pending ones.
describe('CreaEvaluationModal — resubmission grouping', () => {
  const HOUR = 60 * 60 * 1000
  const past = () => new Date(Date.now() - 24 * HOUR).toISOString()
  const future = () => new Date(Date.now() + 24 * HOUR).toISOString()

  // One participant, one of each kind, deliberately NOT in group order: the component has
  // to sort them, and a list that arrives pre-sorted could not tell us whether it does.
  const siblings = () => [
    contribution({ id: 1, memo: 'Nie zurueckgestellt' }),
    contribution({ id: 2, memo: 'Wiedervorlage erreicht', resubmissionAt: past() }),
    contribution({ id: 3, memo: 'Liegt in Wiedervorlage', resubmissionAt: future() }),
    contribution({ id: 4, memo: 'Auch nie zurueckgestellt' }),
  ]

  const mountBatch = (clicked = 1) =>
    mount(CreaEvaluationModal, {
      props: { contribution: siblings().find((c) => c.id === clicked) },
      global: { stubs, mocks: { $t: (key) => key } },
    })

  const open = async (wrapper) => {
    wrapper.findComponent({ name: 'BModal' }).vm.$emit('shown')
    await new Promise((resolve) => setTimeout(resolve, 0))
    await nextTick()
  }

  // The ids of the checkboxes in the order they are rendered, which is what the moderator
  // reads top to bottom.
  const renderedIds = (wrapper) =>
    wrapper.findAll('input[id^="crea-pick-"]').map((input) => input.attributes('id'))

  const mockSiblings = (list) => {
    useApolloClient.mockReturnValue({
      resolveClient: () => ({
        query: vi.fn(async () => ({
          data: { adminListContributions: { contributionList: list } },
        })),
      }),
    })
  }

  beforeEach(() => {
    useMutation.mockReturnValue({ mutate: vi.fn() })
    mockSiblings(siblings())
  })

  it('orders the checklist untouched, due, then put off', async () => {
    const wrapper = mountBatch()
    await open(wrapper)
    expect(renderedIds(wrapper)).toEqual([
      'crea-pick-1',
      'crea-pick-4',
      'crea-pick-2',
      'crea-pick-3',
    ])
  })

  // Read the headings as elements, not as substrings of the rendered text: the due key
  // has the other one as its prefix, so a text search cannot tell them apart.
  const headings = (wrapper) =>
    wrapper.findAll('p.crea-section-heading').map((heading) => heading.text())

  it('heads the two resubmission groups and rules them off', async () => {
    const wrapper = mountBatch()
    await open(wrapper)
    expect(headings(wrapper)).toEqual(['crea.resubmissionDue', 'crea.resubmission'])
    expect(wrapper.findAll('hr.crea-section-rule')).toHaveLength(2)
  })

  it('preselects only what was never put off', async () => {
    const wrapper = mountBatch()
    await open(wrapper)
    expect(wrapper.vm.selectedIds).toEqual([1, 4])
  })

  // Bernd's call, and the reason the middle group exists at all: a due contribution has
  // been handled once before, so it does not come back preselected either.
  it('leaves a due resubmission unticked', async () => {
    const wrapper = mountBatch()
    await open(wrapper)
    expect(wrapper.vm.selectedIds).not.toContain(2)
    expect(wrapper.vm.groupedContributions.due.map((c) => c.id)).toEqual([2])
  })

  // Whichever button was pressed, that contribution is the one the moderator asked about.
  it('keeps the clicked contribution ticked inside the put-off group', async () => {
    const wrapper = mountBatch(3)
    await open(wrapper)
    expect(wrapper.vm.selectedIds).toEqual([1, 3, 4])
    expect(renderedIds(wrapper).at(-1)).toBe('crea-pick-3')
  })

  it('ticks nothing but the clicked one when everything is put off', async () => {
    mockSiblings([
      contribution({ id: 7, resubmissionAt: future() }),
      contribution({ id: 8, resubmissionAt: future() }),
    ])
    const wrapper = mount(CreaEvaluationModal, {
      props: { contribution: contribution({ id: 8, resubmissionAt: future() }) },
      global: { stubs, mocks: { $t: (key) => key } },
    })
    await open(wrapper)
    expect(wrapper.vm.selectedIds).toEqual([8])
  })

  // Nothing put off means nothing to separate: the participant whose contributions were
  // never touched sees the plain preselected list the modal always showed.
  it('shows no heading and no rule when nothing was put off', async () => {
    mockSiblings([contribution({ id: 5 }), contribution({ id: 6 })])
    const wrapper = mountBatch()
    await open(wrapper)
    expect(headings(wrapper)).toEqual([])
    expect(wrapper.findAll('hr.crea-section-rule')).toHaveLength(0)
    expect(wrapper.vm.selectedIds).toEqual([5, 6])
  })

  // A null date must not read as 1970 and drop the contribution into the due group -
  // new Date(null) is the epoch, so the empty case has to be caught before parsing.
  it('treats a missing date as never put off', async () => {
    mockSiblings([
      contribution({ id: 9, resubmissionAt: null }),
      contribution({ id: 10, resubmissionAt: past() }),
    ])
    const wrapper = mount(CreaEvaluationModal, {
      props: { contribution: contribution({ id: 9 }) },
      global: { stubs, mocks: { $t: (key) => key } },
    })
    await open(wrapper)
    expect(wrapper.vm.groupedContributions.open.map((c) => c.id)).toEqual([9])
    expect(wrapper.vm.selectedIds).toEqual([9])
  })
})
