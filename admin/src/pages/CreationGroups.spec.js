import { mount } from '@vue/test-utils'
import { beforeEach, describe, expect, it, vi } from 'vitest'
import { CreationGroups } from './CreationGroups'

vi.mock('vue-i18n', () => ({
  useI18n: () => ({
    // The values are kept in the returned string so that a test can see which numbers went
    // into a sentence, not only which key was picked.
    t: (key, values) => (values ? `${key} ${JSON.stringify(values)}` : key),
    d: (value) => String(value),
  }),
}))

// The groups the list renders. Declared here so a test can swap it before mounting.
const creationGroupsResult = { value: { creationGroups: [] } }

// The one-shot search. It answers per group id, so a test can tell WHICH group was asked
// about -- an always-the-same mock could not see the bug this replaced.
const clientQuery = vi.fn(({ variables }) =>
  Promise.resolve({
    data: { legacyHashtagCounts: { exact: variables.id * 10, loose: variables.id } },
  }),
)

vi.mock('@vue/apollo-composable', () => ({
  useMutation: vi.fn(() => ({
    mutate: vi.fn(),
  })),
  useQuery: vi.fn(() => ({
    result: creationGroupsResult,
    error: { value: null },
    refetch: vi.fn(),
    onResult: vi.fn(),
    onError: vi.fn(),
  })),
  useApolloClient: vi.fn(() => ({ client: { query: clientQuery } })),
}))

vi.mock('@/store/useAdminStore', () => ({
  useAdminStore: vi.fn(() => ({
    moderator: {
      id: 0,
      name: 'test moderator',
      role: 'ADMIN',
    },
  })),
}))

vi.mock('@/composables/useToast', () => ({
  useAppToast: () => ({
    toastSuccess: vi.fn(),
    toastError: vi.fn(),
  }),
}))

const mockBFormGroup = {
  name: 'BFormGroup',
  template: '<div class="mock-bformgroup"><slot></slot></div>',
}
const mockBFormInput = {
  name: 'BFormInput',
  props: ['modelValue'],
  emits: ['update:modelValue'],
  template:
    '<input data-testid="mock-bforminput" :value="modelValue" @input="$emit(\'update:modelValue\', $event.target.value)" />',
}
const mockBButton = {
  name: 'BButton',
  template: '<button data-testid="mock-bbutton"><slot></slot></button>',
}
const mockBModal = {
  name: 'BModal',
  props: ['modelValue', 'title', 'okTitle', 'okDisabled'],
  template: '<div class="mock-bmodal" :data-open="String(modelValue)"><slot></slot></div>',
}
const mockBFormCheckbox = {
  name: 'BFormCheckbox',
  props: ['modelValue'],
  template: '<label class="mock-bformcheckbox"><slot></slot></label>',
}

describe('CreationGroups', () => {
  let wrapper

  const createWrapper = () =>
    mount(CreationGroups, {
      global: {
        stubs: {
          BFormGroup: mockBFormGroup,
          BFormInput: mockBFormInput,
          BButton: mockBButton,
          BModal: mockBModal,
          BFormCheckbox: mockBFormCheckbox,
        },
        mocks: {
          $t: (key, values) => (values ? `${key} ${JSON.stringify(values)}` : key),
        },
      },
    })

  beforeEach(() => {
    vi.clearAllMocks()
    creationGroupsResult.value = { creationGroups: [] }
    wrapper = createWrapper()
  })

  const flushPromises = () => new Promise((resolve) => setTimeout(resolve))
  const modal = () => wrapper.findComponent(mockBModal)
  const isOpen = () => modal().attributes('data-open') === 'true'
  const isSearching = () => modal().text().includes('creationGroupsAdmin.adoption.searching')
  // The counts as the panel shows them, read back from the sentences it prints.
  const shownCounts = () => {
    const exact = modal()
      .text()
      .match(/foundExact \{"count":(\d+)/)
    if (!exact) {
      return null
    }
    const loose = modal()
      .text()
      .match(/foundLoose \{"count":(\d+)/)
    return { exact: Number(exact[1]), loose: loose ? Number(loose[1]) : 0 }
  }
  // The button that opens the adoption panel for the row at this index.
  const clickCheck = (row) => wrapper.findAll('ul li')[row].findAll('button')[0].trigger('click')
  const openAdoption = async (row) => {
    await clickCheck(row)
    await flushPromises()
  }

  it('renders the group management page for an admin', () => {
    expect(wrapper.find('.creation-groups').exists()).toBe(true)
    expect(wrapper.text()).toContain('creationGroupsAdmin.title')
    expect(wrapper.text()).toContain('creationGroupsAdmin.addTitle')
  })

  it('shows the empty hint when there are no groups yet', () => {
    expect(wrapper.text()).toContain('creationGroupsAdmin.empty')
  })

  it('offers a create button', () => {
    expect(wrapper.find('[data-testid="mock-bbutton"]').exists()).toBe(true)
  })

  describe('suggested tag', () => {
    const inputs = () => wrapper.findAll('[data-testid="mock-bforminput"]')
    const suggestionFor = async (name) => {
      await inputs()[0].setValue(name)
      return inputs()[1].element.value
    }

    // Umlauts are valid in a tag, so the suggestion must keep them instead of dropping
    // them — German as well as Scandinavian ones.
    it('keeps umlauts and ß', async () => {
      expect(await suggestionFor('Freiwillige Feuerwehr Grünwald')).toBe(
        'freiwillige-feuerwehr-grünwald',
      )
      expect(await suggestionFor('Straßenfest Köln')).toBe('straßenfest-köln')
    })

    it('keeps Scandinavian letters', async () => {
      expect(await suggestionFor('Ålesund Kystlag')).toBe('ålesund-kystlag')
      expect(await suggestionFor('Nørrebro Fællesskab')).toBe('nørrebro-fællesskab')
    })

    it('drops punctuation and trims hyphens and whitespace', async () => {
      expect(await suggestionFor('Gruppe 42 – Süd!')).toBe('gruppe-42-süd')
      expect(await suggestionFor('  Rand  ')).toBe('rand')
    })

    it('stops suggesting once the tag was typed by hand', async () => {
      await inputs()[1].setValue('eigener-tag')
      expect(await suggestionFor('Ganz anders')).toBe('eigener-tag')
    })
  })

  // The whole point of storing the state instead of deriving it from the group's age:
  // every group that exists today was created before the adoption did, so "never looked
  // at" has to be readable off the row.
  describe('adoption state per group', () => {
    const mountWith = (extra) => {
      creationGroupsResult.value = {
        creationGroups: [{ id: 7, tag: 'amstetten', name: 'Amstetten', ...extra }],
      }
      return createWrapper()
    }

    it('flags a group nobody has looked at yet', () => {
      const w = mountWith({ hashtagsAdoptedAt: null, hashtagsAdoptedCount: null })
      expect(w.find('[data-test="adoption-state-7"]').text()).toBe(
        'creationGroupsAdmin.adoption.stateUnchecked',
      )
    })

    it('reports what a run adopted', () => {
      const w = mountWith({
        hashtagsAdoptedAt: '2026-08-01T10:00:00.000Z',
        hashtagsAdoptedCount: 987,
      })
      expect(w.find('[data-test="adoption-state-7"]').text()).toMatch(
        /^creationGroupsAdmin\.adoption\.stateAdopted \{"date":".+","count":987\}$/,
      )
    })

    // "I looked and there was nothing" must read differently from "nobody has looked" --
    // otherwise a group with nothing to adopt keeps asking to be checked forever.
    it('tells "looked, found nothing" apart from "not looked at"', () => {
      const w = mountWith({
        hashtagsAdoptedAt: '2026-08-01T10:00:00.000Z',
        hashtagsAdoptedCount: 0,
      })
      expect(w.find('[data-test="adoption-state-7"]').text()).toMatch(
        /^creationGroupsAdmin\.adoption\.stateNothing \{"date":".+"\}$/,
      )
    })
  })

  // The bug this replaced: useLazyQuery's load() answers only the FIRST time and returns a
  // bare `false` afterwards without asking the server. Every group after the first reported
  // "nothing found" until the page was reloaded -- and it looked like a real answer, because
  // the missing result was read as zero.
  describe('searching several groups in a row', () => {
    beforeEach(() => {
      creationGroupsResult.value = {
        creationGroups: [
          { id: 1, tag: 'amstetten', name: 'Amstetten' },
          { id: 2, tag: 'feuerwehr', name: 'Feuerwehr' },
        ],
      }
      wrapper = createWrapper()
    })

    it('asks the server again for the second group', async () => {
      await openAdoption(0)
      await openAdoption(1)

      expect(clientQuery).toHaveBeenCalledTimes(2)
      expect(clientQuery.mock.calls[1][0].variables).toEqual({ id: 2 })
      // The counts shown must be the SECOND group's, not the first one's and not zero.
      expect(shownCounts()).toEqual({ exact: 20, loose: 2 })
      expect(modal().props('title')).toContain('"group":"Feuerwehr"')
    })

    // A missing answer is not an empty result. Reading it as zero is what hid the bug.
    it('reports a failed search instead of showing it as "nothing found"', async () => {
      clientQuery.mockResolvedValueOnce({ data: null })
      await openAdoption(0)

      expect(shownCounts()).toBeNull()
      expect(isOpen()).toBe(false)
    })
  })

  // Closing the panel and opening another group before the first search answers. The
  // sibling of the bug above: numbers that look like an answer but belong to a different
  // group. The panel would show the first group's counts under the second group's title,
  // with the confirm button live -- and confirming adopts the SECOND group, because the
  // mutation reads adoptionId. Nothing from a search that has been superseded may reach
  // the screen, and that covers all three ways out of openAdoption, not just the counts.
  describe('a second search started before the first one answers', () => {
    const amstetten = { id: 1, tag: 'amstetten', name: 'Amstetten' }
    const feuerwehr = { id: 2, tag: 'feuerwehr', name: 'Feuerwehr' }

    // A search that answers only when the test says so.
    const pending = () => {
      let settle
      clientQuery.mockImplementationOnce(
        ({ variables }) =>
          new Promise((resolve, reject) => {
            settle = { resolve, reject, id: variables.id }
          }),
      )
      return () => settle
    }

    beforeEach(() => {
      creationGroupsResult.value = { creationGroups: [amstetten, feuerwehr] }
      wrapper = createWrapper()
    })

    it('keeps the second group’s counts when the first answer arrives late', async () => {
      const first = pending()
      const second = pending()

      await clickCheck(0)
      await clickCheck(1)

      // The two searches answer in the order they were made, so say out loud which group
      // each one was actually about. Without this the test would still pass if both
      // requests went out for the same group.
      expect(first().id).toBe(amstetten.id)
      expect(second().id).toBe(feuerwehr.id)

      first().resolve({ data: { legacyHashtagCounts: { exact: 10, loose: 1 } } })
      await flushPromises()
      // The second search is still running, so the panel must still be searching.
      expect(shownCounts()).toBeNull()
      expect(isSearching()).toBe(true)
      // Nothing to confirm yet: the first group's numbers must not have armed the button.
      expect(modal().props('okDisabled')).toBe(true)

      second().resolve({ data: { legacyHashtagCounts: { exact: 20, loose: 2 } } })
      await flushPromises()
      expect(shownCounts()).toEqual({ exact: 20, loose: 2 })
      expect(isSearching()).toBe(false)
    })

    it('leaves the second group’s panel open when the first search fails late', async () => {
      const first = pending()

      await clickCheck(0)
      await openAdoption(1)

      // Same here: which group each search was about, not just the order they answered in.
      // The second one runs on the standard mock, so its id is read off the call.
      expect(first().id).toBe(amstetten.id)
      expect(clientQuery.mock.calls[1][0].variables).toEqual({ id: feuerwehr.id })

      first().reject(new Error('the first search broke'))
      await flushPromises()

      expect(isOpen()).toBe(true)
      expect(shownCounts()).toEqual({ exact: 20, loose: 2 })
    })
  })
})
