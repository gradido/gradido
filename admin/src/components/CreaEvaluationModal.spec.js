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
