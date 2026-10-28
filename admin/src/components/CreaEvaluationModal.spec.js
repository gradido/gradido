import { useApolloClient, useMutation } from '@vue/apollo-composable'
import { mount } from '@vue/test-utils'
import {
  BBadge,
  BButton,
  BFormCheckbox,
  BFormInput,
  BFormTextarea,
  BSpinner,
  createBootstrap,
} from 'bootstrap-vue-next'
import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest'
import { nextTick } from 'vue'
import { forgetUserRemarks } from '@/composables/useUserRemark'
import { userRemark } from '@/graphql/userRemark'
import { CreaEvaluationModal } from './CreaEvaluationModal'

// This file exists because the [ANREDE] fill moved OUT of the tested backend and INTO
// this component. Without it the salutation handling had no test on either side of the
// wire: the backend stopped substituting the placeholder and nothing checked that anyone
// else did. The leak these tests pin actually shipped once - a rewrite rendered the draft
// with the typed salutation instead of the effective one, so a participant would have
// received a reply literally beginning "[ANREDE],".

vi.mock('@vue/apollo-composable')
// What the window said, with the words it put in: a message names its member through them.
const { said, toastError } = vi.hoisted(() => ({ said: [], toastError: vi.fn() }))
vi.mock('vue-i18n', () => ({
  // `d` for the remark's field, which says when it was written last.
  useI18n: () => ({
    t: (key, values) => {
      said.push([key, values])
      return key
    },
    d: () => 'date',
    locale: { value: 'de' },
  }),
}))
vi.mock('@/composables/useToast', () => ({
  useAppToast: () => ({ toastSuccess: vi.fn(), toastError }),
}))
vi.mock('@/composables/useCreaSound', () => ({
  primeCreaSound: vi.fn(),
  playCreaSound: vi.fn(),
}))
// Which side of the phone boundary the window is on, set per test. jsdom has no matchMedia, so
// the real composable would answer `unknown` everywhere.
const { viewport } = await vi.hoisted(async () => {
  const { ref } = await import('vue')
  return { viewport: ref('unknown') }
})
vi.mock('@/composables/useViewport', () => ({ useViewport: () => viewport }))

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
// The real controls, so the tests can type and click: in the app the build resolves them by
// name, which the tests leave out.
const components = { BBadge, BButton, BFormCheckbox, BFormInput, BFormTextarea, BSpinner }

// What the moderator sees and does, read off the rendered modal. The draft is the tall
// field under "crea.response"; the other two textareas (context, signature) are two rows.
const responseField = (wrapper) => wrapper.find('textarea[rows="16"]')
const buttonNamed = (wrapper, label) => wrapper.findAll('button').find((b) => b.text() === label)
const settle = async () => {
  await new Promise((resolve) => setTimeout(resolve, 0))
  await nextTick()
}

describe('CreaEvaluationModal — salutation', () => {
  let mutate
  let rewriteResult

  const mountModal = (over = {}) =>
    mount(CreaEvaluationModal, {
      props: { contribution: contribution(over) },
      global: { stubs, components },
    })

  // Opens the modal and lets the evaluation settle.
  const open = async (wrapper) => {
    wrapper.findComponent({ name: 'BModal' }).vm.$emit('shown')
    await settle()
  }

  // Picks another outcome than Crea's and asks for a reply written for it.
  const rewriteFor = async (wrapper, decision) => {
    await buttonNamed(wrapper, `crea.decision.${decision}`).trigger('click')
    await buttonNamed(wrapper, 'crea.rewrite').trigger('click')
    await settle()
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
    expect(responseField(wrapper).element.value).toContain('Lieber Thomas')
    expect(responseField(wrapper).element.value).not.toContain(SALUTATION_PLACEHOLDER)
  })

  // The regression this file was written for. A rewrite must render with the SAME
  // salutation as the first draft; rendering it with the (empty) input field instead
  // leaves the raw placeholder in a reply the moderator then sends.
  it('keeps the placeholder filled after a rewrite for another decision', async () => {
    const wrapper = mountModal()
    await open(wrapper)
    await rewriteFor(wrapper, 'deny')
    expect(mutate).toHaveBeenCalledTimes(2)
    expect(responseField(wrapper).element.value).not.toContain(SALUTATION_PLACEHOLDER)
    expect(responseField(wrapper).element.value).toContain('Lieber Thomas')
  })

  // Once the draft has been rendered any other way, the watcher's "did the moderator
  // hand-edit this?" guard stops matching and the field goes dead for the rest of the
  // session. That is why the rewrite above has to go through the same render path.
  it('still follows the salutation field after a rewrite', async () => {
    const wrapper = mountModal()
    await open(wrapper)
    await rewriteFor(wrapper, 'deny')
    await wrapper.find('#crea-salutation').setValue('Hallo Tom')
    expect(responseField(wrapper).element.value).toContain('Hallo Tom')
    expect(responseField(wrapper).element.value).not.toContain(SALUTATION_PLACEHOLDER)
  })

  it('falls back to the heuristic when the moderator empties the field', async () => {
    const wrapper = mountModal({ user: { firstName: 'Thomas', salutation: 'Lieber Tom' } })
    await open(wrapper)
    expect(wrapper.find('#crea-salutation').element.value).toBe('Lieber Tom')
    await wrapper.find('#crea-salutation').setValue('')
    expect(responseField(wrapper).element.value).toContain('Lieber Thomas')
    expect(responseField(wrapper).element.value).not.toContain(SALUTATION_PLACEHOLDER)
  })

  // The counterpart of the backend's own placeholder test. The two packages hand this
  // literal to each other and neither can import the other's copy, so both pin it: change
  // one without the other and a test fails instead of a participant getting "[ANREDE],".
  it('expects exactly the placeholders the backend emits', async () => {
    const wrapper = mountModal()
    await open(wrapper)
    expect(responseField(wrapper).element.value).toContain(SIGNATURE_PLACEHOLDER)
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
      global: { stubs, components, mocks: { $t: (key) => key } },
    })

  const open = async (wrapper) => {
    wrapper.findComponent({ name: 'BModal' }).vm.$emit('shown')
    await settle()
  }

  // The ticked contributions. Which ones, not in which order: the batch input is built by
  // filtering the loaded list, so the order of the ticks carries no meaning.
  const tickedIds = (wrapper) =>
    wrapper
      .findAll('input[id^="crea-pick-"]')
      .filter((input) => input.element.checked)
      .map((input) => Number(input.attributes('id').replace('crea-pick-', '')))
      .sort((a, b) => a - b)

  // The heading each checkbox sits under, as the moderator reads the list from the top:
  // '' for the untouched group, which carries none.
  const groupOf = (wrapper) => {
    const groups = {}
    let heading = ''
    const box = wrapper.find('input[id^="crea-pick-"]').element.closest('.border')
    for (const element of box.children) {
      if (element.matches('p.crea-section-heading')) {
        heading = element.textContent.trim()
      }
      const pick = element.querySelector('input[id^="crea-pick-"]')
      if (pick) {
        groups[Number(pick.id.replace('crea-pick-', ''))] = heading
      }
    }
    return groups
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
    expect(wrapper.findAll('hr')).toHaveLength(2)
  })

  it('preselects only what was never put off', async () => {
    const wrapper = mountBatch()
    await open(wrapper)
    expect(tickedIds(wrapper)).toEqual([1, 4])
  })

  // Bernd's call, and the reason the middle group exists at all: a due contribution has
  // been handled once before, so it does not come back preselected either.
  it('leaves a due resubmission unticked', async () => {
    const wrapper = mountBatch()
    await open(wrapper)
    expect(tickedIds(wrapper)).not.toContain(2)
    expect(groupOf(wrapper)[2]).toBe('crea.resubmissionDue')
  })

  // Whichever button was pressed, that contribution is the one the moderator asked about.
  it('keeps the clicked contribution ticked inside the put-off group', async () => {
    const wrapper = mountBatch(3)
    await open(wrapper)
    expect(tickedIds(wrapper)).toEqual([1, 3, 4])
    expect(renderedIds(wrapper).at(-1)).toBe('crea-pick-3')
  })

  it('ticks nothing but the clicked one when everything is put off', async () => {
    mockSiblings([
      contribution({ id: 7, resubmissionAt: future() }),
      contribution({ id: 8, resubmissionAt: future() }),
    ])
    const wrapper = mount(CreaEvaluationModal, {
      props: { contribution: contribution({ id: 8, resubmissionAt: future() }) },
      global: { stubs, components, mocks: { $t: (key) => key } },
    })
    await open(wrapper)
    expect(tickedIds(wrapper)).toEqual([8])
  })

  // Nothing put off means nothing to separate: the participant whose contributions were
  // never touched sees the plain preselected list the modal always showed.
  it('shows no heading and no rule when nothing was put off', async () => {
    mockSiblings([contribution({ id: 5 }), contribution({ id: 6 })])
    const wrapper = mountBatch()
    await open(wrapper)
    expect(headings(wrapper)).toEqual([])
    expect(wrapper.findAll('hr')).toHaveLength(0)
    expect(tickedIds(wrapper)).toEqual([5, 6])
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
      global: { stubs, components, mocks: { $t: (key) => key } },
    })
    await open(wrapper)
    expect(groupOf(wrapper)).toEqual({ 9: '', 10: 'crea.resubmissionDue' })
    expect(tickedIds(wrapper)).toEqual([9])
  })

  // A moderator's ask: with a long list, ticking the two she wants beats unticking the
  // twenty she does not. One control for both directions, so it lives with the grouping
  // tests -- what "all" means is exactly a question about the groups.
  const toggleAll = (wrapper) => wrapper.find('button.crea-toggle-all')

  it('clears the whole checklist in one click', async () => {
    const wrapper = mountBatch()
    await open(wrapper)
    expect(tickedIds(wrapper)).toEqual([1, 4])
    await toggleAll(wrapper).trigger('click')
    expect(tickedIds(wrapper)).toEqual([])
  })

  // The way back takes the resubmission groups with it. They start unticked by design
  // (E-026), but that governs the default, not what the moderator may ask for on purpose --
  // and a control labelled "all" that quietly skipped two groups would be lying.
  it('ticks every group on the way back, put-off ones included', async () => {
    const wrapper = mountBatch()
    await open(wrapper)
    await toggleAll(wrapper).trigger('click')
    await toggleAll(wrapper).trigger('click')
    expect(tickedIds(wrapper)).toEqual([1, 2, 3, 4])
  })

  it('names the direction the next click would take', async () => {
    const wrapper = mountBatch()
    await open(wrapper)
    expect(toggleAll(wrapper).text()).toBe('crea.deselectAll')
    await toggleAll(wrapper).trigger('click')
    expect(toggleAll(wrapper).text()).toBe('crea.selectAll')
  })
})

// The window on a phone (S3): the head and the foot stand still and the body scrolls, and the
// reply is half as tall as at the desk.
describe('CreaEvaluationModal — on a phone and at the desk', () => {
  const evaluation = {
    responseText: RAW_REPLY,
    defaultSalutation: 'Lieber Thomas',
    overallVerdict: 'confirm',
    flags: [],
    activities: [],
    openPoints: [],
  }
  const mounted = []

  beforeEach(() => {
    viewport.value = 'unknown'
    useMutation.mockReturnValue({
      mutate: vi.fn(async () => ({ data: { creaEvaluateContribution: evaluation } })),
    })
    useApolloClient.mockReturnValue({
      resolveClient: () => ({
        query: vi.fn(async () => ({ data: { adminListContributions: { contributionList: [] } } })),
      }),
    })
  })

  afterEach(() => {
    for (const wrapper of mounted.splice(0)) {
      wrapper.unmount()
    }
  })

  // The REAL modal, drawn in place: whether it scrolls is a class bootstrap-vue-next makes of a
  // prop, and a stub would answer to whatever was written into it.
  it('the modal scrolls its body', async () => {
    const wrapper = mount(CreaEvaluationModal, {
      props: { contribution: contribution() },
      // No focus trap: jsdom lays nothing out, so the trap finds nothing to focus and throws a
      // few frames after a test has ended -- into whichever test runs then.
      attrs: { teleportDisabled: true, noTrap: true },
      global: { components, plugins: [createBootstrap()] },
    })
    mounted.push(wrapper)
    // Opened as the page opens it: the modal's own v-model turns true.
    wrapper.findComponent({ name: 'BModal' }).vm.$emit('update:modelValue', true)
    await settle()

    const dialog = wrapper.find('.modal-dialog')
    expect(dialog.exists()).toBe(true)
    expect(dialog.classes()).toContain('modal-dialog-scrollable')
    // Head, body and foot are the three parts the class keeps apart: the foot with
    // "Schließen" stays below the body that scrolls.
    const parts = Array.from(wrapper.find('.modal-content').element.children).map(
      (part) => part.className.split(' ')[0],
    )
    expect(parts).toEqual(['modal-header', 'modal-body', 'modal-footer'])
    expect(wrapper.find('.modal-footer').text()).toContain('crea.close')
  })

  it.each([
    ['mobile', '8'],
    ['desktop', '16'],
    ['unknown', '16'],
  ])(
    'the answer field has eight rows on a phone and sixteen at the desk (%s)',
    async (side, rows) => {
      viewport.value = side
      const wrapper = mount(CreaEvaluationModal, {
        props: { contribution: contribution() },
        global: { stubs, components },
      })
      mounted.push(wrapper)
      wrapper.findComponent({ name: 'BModal' }).vm.$emit('shown')
      await settle()

      // The reply is the one field that holds the draft; the signature below it keeps its two
      // rows on every width.
      const fields = wrapper.findAll('textarea')
      const reply = fields.find((field) => field.element.value.includes('Lieber Thomas'))
      expect(reply.attributes('rows')).toBe(rows)
      expect(
        fields
          .filter((field) => field.element !== reply.element)
          .map((field) => field.attributes('rows')),
      ).toEqual(['2'])
    },
  )
})

// The moderation's remark on the member in Crea's window (Bernd, 28.10.2026): shown and written with
// the card's parts, read by Crea from the server -- so every call to Crea first saves what waits.
describe('CreaEvaluationModal — the remark on the member', () => {
  // What reaches the server, in order: the remark's saves and the calls to Crea.
  let calls
  let siblings
  // What the server holds on the member; null for a member without a remark.
  let remarkOnServer
  const REMARK = {
    remark: 'Rentnerin seit Januar 2025',
    updatedAt: '2026-10-28T08:40:00.000Z',
    updatedByName: 'Bernd Hückstädt',
  }
  const EVALUATION = {
    responseText: RAW_REPLY,
    defaultSalutation: 'Lieber Thomas',
    overallVerdict: 'confirm',
    flags: [],
    activities: [],
    openPoints: [],
  }

  // With the foot, where "Bewerten" stands.
  const withFoot = {
    BModal: { ...stubs.BModal, template: '<div><slot /><slot name="footer" /></div>' },
  }
  const mountModal = () =>
    mount(CreaEvaluationModal, {
      props: { contribution: contribution() },
      global: { stubs: withFoot, components },
    })
  const open = async (wrapper) => {
    wrapper.findComponent({ name: 'BModal' }).vm.$emit('shown')
    await settle()
  }
  const write = async (wrapper, words) => {
    await wrapper.find('[data-test="member-remark-toggle"]').trigger('click')
    await wrapper.find('[data-test="member-remark-field"]').setValue(words)
  }
  const creaInputs = () => calls.filter(([kind]) => kind === 'crea').map(([, vars]) => vars.input)
  // "Crea liest mit", off at each opening.
  const readsSwitch = (wrapper) => {
    const found = wrapper.find('[data-test="crea-reads-remark"]')
    return found.exists() && found.element.tagName !== 'INPUT' ? found.find('input') : found
  }
  const letCreaRead = (wrapper) => readsSwitch(wrapper).setValue(true)
  const evaluateSingle = (wrapper) => wrapper.find('[data-test="crea-evaluate-single"]')

  beforeEach(() => {
    forgetUserRemarks()
    calls = []
    siblings = []
    remarkOnServer = REMARK
    said.length = 0
    toastError.mockClear()
    useMutation.mockImplementation(() => ({
      mutate: vi.fn(async (vars) => {
        calls.push(['crea', vars])
        return { data: { creaEvaluateContribution: EVALUATION, creaEvaluateBatch: EVALUATION } }
      }),
    }))
    useApolloClient.mockReturnValue({
      resolveClient: () => ({
        query: vi.fn(async ({ query }) =>
          query === userRemark
            ? { data: { userRemark: remarkOnServer } }
            : { data: { adminListContributions: { contributionList: siblings } } },
        ),
        mutate: vi.fn(async ({ variables }) => {
          calls.push(['remark', variables])
          return { data: { setUserRemark: { ...REMARK, remark: variables.remark } } }
        }),
      }),
    })
  })

  afterEach(() => {
    forgetUserRemarks()
  })

  // Bernd, 28.10.2026: Crea reads the remark only where the moderator turns "Crea liest mit" on.
  it('shows the remark with "Crea liest mit" off, and waits for "Bewerten"', async () => {
    const wrapper = mountModal()
    await open(wrapper)
    expect(wrapper.find('[data-test="member-remark"]').text()).toContain(REMARK.remark)
    expect(
      wrapper.find('[data-test="member-remark-toggle"]').attributes('disabled'),
    ).toBeUndefined()
    expect(readsSwitch(wrapper).element.checked).toBe(false)
    expect(creaInputs()).toEqual([])
    expect(evaluateSingle(wrapper).exists()).toBe(true)
  })

  it('judges a member without a remark at once, without the member, and shows no switch', async () => {
    remarkOnServer = null
    const wrapper = mountModal()
    await open(wrapper)
    expect(creaInputs()).toEqual([expect.objectContaining({ userId: null })])
    expect(readsSwitch(wrapper).exists()).toBe(false)
    expect(evaluateSingle(wrapper).exists()).toBe(false)
  })

  it('asks Crea with the member only once "Crea liest mit" is on, never with the words', async () => {
    const wrapper = mountModal()
    await open(wrapper)
    await evaluateSingle(wrapper).trigger('click')
    await settle()
    expect(creaInputs()).toEqual([expect.objectContaining({ userId: null })])
    // Judged without the remark, as asked: nothing more to judge until the switch moves.
    expect(evaluateSingle(wrapper).exists()).toBe(false)
    await letCreaRead(wrapper)
    await evaluateSingle(wrapper).trigger('click')
    await settle()
    expect(creaInputs()[1]).toEqual(expect.objectContaining({ userId: 42 }))
    expect(evaluateSingle(wrapper).exists()).toBe(false)
    // A rewrite reads it as well, while the switch is on.
    await buttonNamed(wrapper, 'crea.decision.deny').trigger('click')
    await buttonNamed(wrapper, 'crea.rewrite').trigger('click')
    await settle()
    expect(creaInputs()[2]).toEqual(
      expect.objectContaining({ userId: 42, moderatorDecision: 'deny' }),
    )
    expect(JSON.stringify(creaInputs())).not.toContain(REMARK.remark)
  })

  it('asks Crea for several contributions with the member only once "Crea liest mit" is on', async () => {
    siblings = [contribution(), contribution({ id: 2, memo: 'Vorlesen im Kindergarten' })]
    const wrapper = mountModal()
    await open(wrapper)
    await wrapper.find('[data-test="crea-evaluate-batch"]').trigger('click')
    await settle()
    await letCreaRead(wrapper)
    await wrapper.find('[data-test="crea-evaluate-batch"]').trigger('click')
    await settle()
    expect(creaInputs()).toEqual([
      expect.objectContaining({ userId: null }),
      expect.objectContaining({ userId: 42 }),
    ])
  })

  it('turns "Crea liest mit" off at each opening', async () => {
    const wrapper = mountModal()
    await open(wrapper)
    await letCreaRead(wrapper)
    expect(readsSwitch(wrapper).element.checked).toBe(true)
    wrapper.findComponent({ name: 'BModal' }).vm.$emit('hidden')
    await settle()
    await open(wrapper)
    expect(readsSwitch(wrapper).element.checked).toBe(false)
  })

  it('saves the words typed in the window before Crea is asked', async () => {
    siblings = [contribution(), contribution({ id: 2, memo: 'Vorlesen im Kindergarten' })]
    const wrapper = mountModal()
    await open(wrapper)
    await write(wrapper, 'Kind, 5 Jahre alt')
    await letCreaRead(wrapper)
    await buttonNamed(wrapper, 'crea.evaluate').trigger('click')
    await settle()
    expect(calls).toEqual([
      ['remark', { userId: 42, remark: 'Kind, 5 Jahre alt' }],
      ['crea', { input: expect.objectContaining({ userId: 42 }) }],
    ])
  })

  it('offers "Bewerten" again once the remark Crea reads changed, and judges anew', async () => {
    const wrapper = mountModal()
    await open(wrapper)
    await letCreaRead(wrapper)
    await evaluateSingle(wrapper).trigger('click')
    await settle()
    expect(creaInputs()).toHaveLength(1)
    expect(evaluateSingle(wrapper).exists()).toBe(false)
    await write(wrapper, 'Rentner seit Januar 2025, Kind von Ramona')
    const again = evaluateSingle(wrapper)
    expect(again.exists()).toBe(true)
    await again.trigger('click')
    await settle()
    expect(calls.slice(1)).toEqual([
      ['remark', { userId: 42, remark: 'Rentner seit Januar 2025, Kind von Ramona' }],
      ['crea', { input: expect.objectContaining({ userId: 42 }) }],
    ])
    expect(evaluateSingle(wrapper).exists()).toBe(false)
  })

  it('saves what waits when the window closes, and reads the remark anew on the next opening', async () => {
    const wrapper = mountModal()
    await open(wrapper)
    await write(wrapper, 'Mutter von zwei Kindern')
    wrapper.findComponent({ name: 'BModal' }).vm.$emit('hidden')
    await settle()
    expect(calls.filter(([kind]) => kind === 'remark')).toEqual([
      ['remark', { userId: 42, remark: 'Mutter von zwei Kindern' }],
    ])
    expect(wrapper.find('[data-test="member-remark-toggle"]').exists()).toBe(false)
    await open(wrapper)
    expect(wrapper.find('[data-test="member-remark"]').text()).toContain(REMARK.remark)
  })

  // The second reader's findings (28.10.2026).
  it('keeps a salutation typed and not saved when "Bewerten" is pressed again', async () => {
    const wrapper = mountModal()
    await open(wrapper)
    await evaluateSingle(wrapper).trigger('click')
    await settle()
    await wrapper.find('#crea-salutation').setValue('Liebe Carla')
    await letCreaRead(wrapper)
    await evaluateSingle(wrapper).trigger('click')
    await settle()
    expect(creaInputs()).toHaveLength(2)
    expect(wrapper.find('#crea-salutation').element.value).toBe('Liebe Carla')
  })

  it('offers no second "Bewerten" while a reply is rewritten', async () => {
    useMutation.mockImplementation(() => ({
      mutate: vi.fn((vars) => {
        calls.push(['crea', vars])
        // The rewrite stays on its way.
        return vars.input.moderatorDecision
          ? new Promise(() => undefined)
          : Promise.resolve({ data: { creaEvaluateContribution: EVALUATION } })
      }),
    }))
    const wrapper = mountModal()
    await open(wrapper)
    await evaluateSingle(wrapper).trigger('click')
    await settle()
    await buttonNamed(wrapper, 'crea.decision.deny').trigger('click')
    await buttonNamed(wrapper, 'crea.rewrite').trigger('click')
    await settle()
    await letCreaRead(wrapper)
    expect(evaluateSingle(wrapper).attributes('disabled')).toBeDefined()
  })

  // Found beside it, older than the remark: the same late answer in the batch.
  it('offers no "Bewerten" for several contributions either while a reply is rewritten', async () => {
    siblings = [contribution(), contribution({ id: 2, memo: 'Vorlesen im Kindergarten' })]
    useMutation.mockImplementation(() => ({
      mutate: vi.fn((vars) => {
        calls.push(['crea', vars])
        return vars.input.moderatorDecision
          ? new Promise(() => undefined)
          : Promise.resolve({ data: { creaEvaluateBatch: EVALUATION } })
      }),
    }))
    const wrapper = mountModal()
    await open(wrapper)
    const evaluate = () => wrapper.find('[data-test="crea-evaluate-batch"]')
    await evaluate().trigger('click')
    await settle()
    expect(evaluate().attributes('disabled')).toBeUndefined()
    await buttonNamed(wrapper, 'crea.decision.deny').trigger('click')
    await buttonNamed(wrapper, 'crea.rewrite').trigger('click')
    await settle()
    expect(evaluate().attributes('disabled')).toBeDefined()
  })

  it('asks Crea nothing for a window closed while the remark was read', async () => {
    let answer = () => undefined
    useApolloClient.mockReturnValue({
      resolveClient: () => ({
        query: vi.fn(({ query }) =>
          query === userRemark
            ? new Promise((resolve) => {
                // A member without a remark, who would be judged at once.
                answer = () => resolve({ data: { userRemark: null } })
              })
            : Promise.resolve({ data: { adminListContributions: { contributionList: [] } } }),
        ),
        mutate: vi.fn(),
      }),
    })
    const wrapper = mountModal()
    wrapper.findComponent({ name: 'BModal' }).vm.$emit('shown')
    await settle()
    wrapper.findComponent({ name: 'BModal' }).vm.$emit('hidden')
    answer()
    await settle()
    expect(creaInputs()).toEqual([])
  })

  // coderabbit (#4222): an answer for an earlier opening -- the window closed, or opened since --
  // changes nothing, and a window closed while the words were saved asks Crea nothing.
  // Crea's answers held back until a test hands them out, in the order she was asked.
  const holdAnswers = () => {
    const answers = []
    useMutation.mockImplementation(() => ({
      mutate: vi.fn((vars) => {
        calls.push(['crea', vars])
        return new Promise((resolve, reject) => answers.push({ resolve, reject }))
      }),
    }))
    return answers
  }
  // The saves of the remark held back until a test lets them through.
  const holdSaves = () => {
    const saves = []
    useApolloClient.mockReturnValue({
      resolveClient: () => ({
        query: vi.fn(async ({ query }) =>
          query === userRemark
            ? { data: { userRemark: remarkOnServer } }
            : { data: { adminListContributions: { contributionList: siblings } } },
        ),
        mutate: vi.fn(
          ({ variables }) =>
            new Promise((resolve) => {
              saves.push(() =>
                resolve({ data: { setUserRemark: { ...REMARK, remark: variables.remark } } }),
              )
            }),
        ),
      }),
    })
    return async () => {
      // Closing saves what waits as well: let that through too.
      for (let round = 0; round < 2; round++) {
        for (const save of saves.splice(0)) {
          save()
        }
        await settle()
      }
    }
  }
  const answer = (text) => ({
    data: {
      creaEvaluateContribution: {
        ...EVALUATION,
        responseText: `[ANREDE],\n\n${text}\n\n[SIGNATUR]`,
      },
      creaEvaluateBatch: { ...EVALUATION, responseText: `[ANREDE],\n\n${text}\n\n[SIGNATUR]` },
    },
  })
  const rewritten = (text) => ({
    data: {
      creaRewriteResponse: {
        responseText: `[ANREDE],\n\n${text}\n\n[SIGNATUR]`,
        memoSupplement: null,
      },
      creaRewriteBatch: {
        responseText: `[ANREDE],\n\n${text}\n\n[SIGNATUR]`,
        memoSupplement: null,
      },
    },
  })
  const close = (wrapper) => wrapper.findComponent({ name: 'BModal' }).vm.$emit('hidden')
  const carla = () =>
    contribution({
      id: 2,
      userId: 43,
      memo: 'Vorlesen',
      user: { firstName: 'Carla', lastName: 'Sonne', salutation: null },
    })
  const twoOf = (member) => [member, { ...member, id: member.id + 100, memo: 'Gartenarbeit' }]

  const nothingFirst = async () => undefined
  it.each([
    [
      'a single contribution',
      nothingFirst,
      async (wrapper) => {
        await write(wrapper, 'Kind, 5 Jahre alt')
        await evaluateSingle(wrapper).trigger('click')
      },
    ],
    [
      'several contributions',
      nothingFirst,
      async (wrapper) => {
        await write(wrapper, 'Kind, 5 Jahre alt')
        await wrapper.find('[data-test="crea-evaluate-batch"]').trigger('click')
      },
      () => twoOf(contribution()),
    ],
    [
      'a rewrite',
      async (wrapper) => {
        await evaluateSingle(wrapper).trigger('click')
        await settle()
      },
      async (wrapper) => {
        await buttonNamed(wrapper, 'crea.decision.deny').trigger('click')
        await write(wrapper, 'Kind, 5 Jahre alt')
        await buttonNamed(wrapper, 'crea.rewrite').trigger('click')
      },
    ],
  ])(
    'asks Crea nothing for %s when the window closed while the words were saved',
    async (_kind, first, ask, list) => {
      siblings = list?.() ?? []
      const letSavesThrough = holdSaves()
      const wrapper = mountModal()
      await open(wrapper)
      await first(wrapper)
      const before = creaInputs().length
      await ask(wrapper)
      await settle()
      close(wrapper)
      await letSavesThrough()
      expect(creaInputs()).toHaveLength(before)
    },
  )

  it.each([
    ['a single contribution', async () => undefined, () => []],
    [
      'several contributions',
      async (wrapper) => {
        await wrapper.find('[data-test="crea-evaluate-batch"]').trigger('click')
      },
      () => twoOf(contribution()),
    ],
  ])(
    'lets a late answer for %s change nothing in the window opened since',
    async (_kind, ask, list) => {
      const answers = holdAnswers()
      // A member without a remark: a single contribution is judged the moment the window opens.
      remarkOnServer = null
      siblings = list()
      const wrapper = mountModal()
      await open(wrapper)
      await ask(wrapper)
      await settle()
      close(wrapper)
      // Opened again, for Carla's two contributions: nothing is asked until "Bewerten".
      siblings = twoOf(carla())
      await wrapper.setProps({ contribution: carla() })
      await open(wrapper)
      expect(answers).toHaveLength(1)
      answers[0].resolve(answer('Für Thomas'))
      await settle()
      expect(responseField(wrapper).exists()).toBe(false)
    },
  )

  it.each([
    ['a single contribution', async () => undefined, () => []],
    [
      'several contributions',
      async (wrapper) => {
        await wrapper.find('[data-test="crea-evaluate-batch"]').trigger('click')
      },
      () => twoOf(contribution()),
    ],
  ])(
    'keeps the window opened since waiting for its own answer where a late one for %s fails',
    async (_kind, ask, list) => {
      const answers = holdAnswers()
      // A member without a remark: a single contribution is judged the moment the window opens.
      remarkOnServer = null
      siblings = list()
      const wrapper = mountModal()
      await open(wrapper)
      await ask(wrapper)
      await settle()
      close(wrapper)
      await open(wrapper)
      await ask(wrapper)
      await settle()
      expect(answers).toHaveLength(2)
      answers[0].reject(new Error('Network error'))
      await settle()
      expect(wrapper.find('.spinner-border').exists()).toBe(true)
      answers[1].resolve(answer('Die eigene Antwort'))
      await settle()
      expect(wrapper.find('.alert-danger').exists()).toBe(false)
      expect(responseField(wrapper).element.value).toContain('Die eigene Antwort')
    },
  )

  it.each([
    ['a single contribution', async () => undefined, () => []],
    [
      'several contributions',
      async (wrapper) => {
        await wrapper.find('[data-test="crea-evaluate-batch"]').trigger('click')
      },
      () => twoOf(contribution()),
    ],
  ])(
    'lets a late rewrite for %s change nothing in the window opened since, which rewrites on its own',
    async (_kind, ask, list) => {
      const answers = holdAnswers()
      // A member without a remark: a single contribution is judged the moment the window opens.
      remarkOnServer = null
      siblings = list()
      const wrapper = mountModal()
      await open(wrapper)
      await ask(wrapper)
      await settle()
      answers[0].resolve(answer('Erste Antwort'))
      await settle()
      await buttonNamed(wrapper, 'crea.decision.deny').trigger('click')
      await buttonNamed(wrapper, 'crea.rewrite').trigger('click')
      await settle()
      close(wrapper)
      await open(wrapper)
      await ask(wrapper)
      await settle()
      answers[2].resolve(answer('Neue Antwort'))
      await settle()
      await buttonNamed(wrapper, 'crea.decision.deny').trigger('click')
      await buttonNamed(wrapper, 'crea.rewrite').trigger('click')
      await settle()
      expect(answers).toHaveLength(4)
      answers[1].resolve(rewritten('Für die erste Öffnung'))
      await settle()
      expect(responseField(wrapper).element.value).not.toContain('Für die erste Öffnung')
      expect(buttonNamed(wrapper, 'crea.rewrite').attributes('disabled')).toBeDefined()
    },
  )

  it('tells nothing of a late rewrite that failed', async () => {
    const answers = holdAnswers()
    remarkOnServer = null
    const wrapper = mountModal()
    await open(wrapper)
    answers[0].resolve(answer('Erste Antwort'))
    await settle()
    await buttonNamed(wrapper, 'crea.decision.deny').trigger('click')
    await buttonNamed(wrapper, 'crea.rewrite').trigger('click')
    await settle()
    close(wrapper)
    await open(wrapper)
    answers[1].reject(new Error('Network error'))
    await settle()
    expect(toastError).not.toHaveBeenCalled()
  })

  it('shows the contributions of the member it was opened for, not of one opened before', async () => {
    const listOf = (userId) =>
      [1, 2].map((n) =>
        contribution({ id: userId * 10 + n, userId, memo: `Beitrag ${userId}-${n}` }),
      )
    let answerFirst = () => undefined
    useApolloClient.mockReturnValue({
      resolveClient: () => ({
        query: vi.fn(({ query, variables }) => {
          if (query === userRemark) {
            return Promise.resolve({ data: { userRemark: null } })
          }
          const list = {
            data: { adminListContributions: { contributionList: listOf(variables.filter.userId) } },
          }
          // The first member's list is still on its way when the window opens for the second.
          return variables.filter.userId === 7
            ? new Promise((resolve) => {
                answerFirst = () => resolve(list)
              })
            : Promise.resolve(list)
        }),
        mutate: vi.fn(),
      }),
    })
    const wrapper = mount(CreaEvaluationModal, {
      props: { contribution: contribution({ id: 71, userId: 7 }) },
      global: { stubs: withFoot, components },
    })
    await open(wrapper)
    wrapper.findComponent({ name: 'BModal' }).vm.$emit('hidden')
    await wrapper.setProps({ contribution: contribution({ id: 421 }) })
    await open(wrapper)
    expect(wrapper.text()).toContain('Beitrag 42-2')
    answerFirst()
    await settle()
    expect(wrapper.text()).toContain('Beitrag 42-2')
    expect(wrapper.text()).not.toContain('Beitrag 7-2')
  })

  it('names the member whose words could not be saved, also once the window shows another', async () => {
    let failSave = () => undefined
    useApolloClient.mockReturnValue({
      resolveClient: () => ({
        query: vi.fn(async ({ query }) =>
          query === userRemark
            ? { data: { userRemark: REMARK } }
            : { data: { adminListContributions: { contributionList: [] } } },
        ),
        mutate: vi.fn(
          () =>
            new Promise((_resolve, reject) => {
              failSave = () => reject(new Error('Network error'))
            }),
        ),
      }),
    })
    const wrapper = mountModal()
    await open(wrapper)
    await write(wrapper, 'Kind, 5 Jahre alt')
    // Closing saves what waits; the window opens for Carla before the server answers.
    wrapper.findComponent({ name: 'BModal' }).vm.$emit('hidden')
    await settle()
    await wrapper.setProps({
      contribution: contribution({
        id: 2,
        userId: 43,
        user: { firstName: 'Carla', lastName: 'Sonne', salutation: null },
      }),
    })
    await open(wrapper)
    failSave()
    await settle()
    expect(toastError).toHaveBeenCalledWith('remark.failedClosed')
    expect(said).toContainEqual(['remark.failedClosed', { name: 'Thomas Muster' }])
    expect(said).not.toContainEqual(['remark.failedClosed', { name: 'Carla Sonne' }])
  })

  it('still offers "Bewerten" where the words could not be saved: Crea read the remark before them', async () => {
    useApolloClient.mockReturnValue({
      resolveClient: () => ({
        query: vi.fn(async ({ query }) =>
          query === userRemark
            ? { data: { userRemark: REMARK } }
            : { data: { adminListContributions: { contributionList: [] } } },
        ),
        mutate: vi.fn(async ({ variables }) => {
          calls.push(['remark', variables])
          throw new Error('Network error')
        }),
      }),
    })
    const wrapper = mountModal()
    await open(wrapper)
    await letCreaRead(wrapper)
    await evaluateSingle(wrapper).trigger('click')
    await settle()
    await write(wrapper, 'Kind, 5 Jahre alt')
    await evaluateSingle(wrapper).trigger('click')
    await settle()
    expect(creaInputs()).toHaveLength(2)
    expect(evaluateSingle(wrapper).exists()).toBe(true)
  })
})
