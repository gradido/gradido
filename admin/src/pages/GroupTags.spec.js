import { mount } from '@vue/test-utils'
import { describe, it, expect, beforeEach, vi } from 'vitest'
import GroupTags from './GroupTags.vue'

vi.mock('vue-i18n', () => ({
  useI18n: () => ({
    t: (key) => key,
    d: (value) => String(value),
  }),
}))

// The groups the list renders. Declared here so a test can swap it before mounting.
const groupTagsResult = { value: { groupTags: [] } }

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
    result: groupTagsResult,
    error: { value: null },
    refetch: vi.fn(),
    onResult: vi.fn(),
    onError: vi.fn(),
  })),
  useApolloClient: vi.fn(() => ({ client: { query: clientQuery } })),
}))

vi.mock('vuex', () => ({
  useStore: vi.fn(() => ({
    state: {
      moderator: {
        id: 0,
        name: 'test moderator',
        roles: ['ADMIN'],
      },
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
  template: '<input data-testid="mock-bforminput" />',
}
const mockBButton = {
  name: 'BButton',
  template: '<button data-testid="mock-bbutton"><slot></slot></button>',
}
const mockBModal = {
  name: 'BModal',
  template: '<div class="mock-bmodal"><slot></slot></div>',
}
const mockBFormCheckbox = {
  name: 'BFormCheckbox',
  props: ['modelValue'],
  template: '<label class="mock-bformcheckbox"><slot></slot></label>',
}

describe('GroupTags', () => {
  let wrapper

  const createWrapper = () =>
    mount(GroupTags, {
      global: {
        stubs: {
          BFormGroup: mockBFormGroup,
          BFormInput: mockBFormInput,
          BButton: mockBButton,
          BModal: mockBModal,
          BFormCheckbox: mockBFormCheckbox,
        },
        mocks: {
          $t: (key) => key,
        },
      },
    })

  beforeEach(() => {
    vi.clearAllMocks()
    groupTagsResult.value = { groupTags: [] }
    wrapper = createWrapper()
  })

  it('renders the group management page for an admin', () => {
    expect(wrapper.find('.group-tags').exists()).toBe(true)
    expect(wrapper.text()).toContain('groupTagsAdmin.title')
    expect(wrapper.text()).toContain('groupTagsAdmin.addTitle')
  })

  it('shows the empty hint when there are no groups yet', () => {
    expect(wrapper.text()).toContain('groupTagsAdmin.empty')
  })

  it('offers a create button', () => {
    expect(wrapper.find('[data-testid="mock-bbutton"]').exists()).toBe(true)
  })

  describe('suggested tag', () => {
    // Umlauts are valid in a tag, so the suggestion must keep them instead of dropping
    // them — German as well as Scandinavian ones.
    it('keeps German umlauts', () => {
      expect(wrapper.vm.slugify('Freiwillige Feuerwehr Grünwald')).toBe(
        'freiwillige-feuerwehr-grünwald',
      )
      expect(wrapper.vm.slugify('Straßenfest Köln')).toBe('straßenfest-köln')
    })

    it('keeps Scandinavian letters', () => {
      expect(wrapper.vm.slugify('Ålesund Kystlag')).toBe('ålesund-kystlag')
      expect(wrapper.vm.slugify('Nørrebro Fællesskab')).toBe('nørrebro-fællesskab')
    })

    it('drops punctuation and collapses hyphens', () => {
      expect(wrapper.vm.slugify('Gruppe 42 – Süd!')).toBe('gruppe-42-süd')
      expect(wrapper.vm.slugify('  Rand  ')).toBe('rand')
    })
  })

  // The whole point of storing the state instead of deriving it from the group's age:
  // every group that exists today was created before the adoption did, so "never looked
  // at" has to be readable off the row.
  describe('adoption state per group', () => {
    const mountWith = (extra) => {
      groupTagsResult.value = {
        groupTags: [{ id: 7, tag: 'amstetten', name: 'Amstetten', ...extra }],
      }
      return createWrapper()
    }

    it('flags a group nobody has looked at yet', () => {
      const w = mountWith({ hashtagsAdoptedAt: null, hashtagsAdoptedCount: null })
      expect(w.find('[data-test="adoption-state-7"]').text()).toBe(
        'groupTagsAdmin.adoption.stateUnchecked',
      )
    })

    it('reports what a run adopted', () => {
      const w = mountWith({
        hashtagsAdoptedAt: '2026-08-01T10:00:00.000Z',
        hashtagsAdoptedCount: 987,
      })
      expect(w.find('[data-test="adoption-state-7"]').text()).toBe(
        'groupTagsAdmin.adoption.stateAdopted',
      )
    })

    // "I looked and there was nothing" must read differently from "nobody has looked" --
    // otherwise a group with nothing to adopt keeps asking to be checked forever.
    it('tells "looked, found nothing" apart from "not looked at"', () => {
      const w = mountWith({
        hashtagsAdoptedAt: '2026-08-01T10:00:00.000Z',
        hashtagsAdoptedCount: 0,
      })
      expect(w.find('[data-test="adoption-state-7"]').text()).toBe(
        'groupTagsAdmin.adoption.stateNothing',
      )
    })
  })

  // The bug this replaced: useLazyQuery's load() answers only the FIRST time and returns a
  // bare `false` afterwards without asking the server. Every group after the first reported
  // "nothing found" until the page was reloaded -- and it looked like a real answer, because
  // the missing result was read as zero.
  describe('searching several groups in a row', () => {
    beforeEach(() => {
      groupTagsResult.value = {
        groupTags: [
          { id: 1, tag: 'amstetten', name: 'Amstetten' },
          { id: 2, tag: 'feuerwehr', name: 'Feuerwehr' },
        ],
      }
      wrapper = createWrapper()
    })

    it('asks the server again for the second group', async () => {
      await wrapper.vm.openAdoption({ id: 1, tag: 'amstetten', name: 'Amstetten' })
      await wrapper.vm.openAdoption({ id: 2, tag: 'feuerwehr', name: 'Feuerwehr' })

      expect(clientQuery).toHaveBeenCalledTimes(2)
      expect(clientQuery.mock.calls[1][0].variables).toEqual({ id: 2 })
      // The counts shown must be the SECOND group's, not the first one's and not zero.
      expect(wrapper.vm.counts).toEqual({ exact: 20, loose: 2 })
    })

    // A missing answer is not an empty result. Reading it as zero is what hid the bug.
    it('reports a failed search instead of showing it as "nothing found"', async () => {
      clientQuery.mockResolvedValueOnce({ data: null })
      await wrapper.vm.openAdoption({ id: 1, tag: 'amstetten', name: 'Amstetten' })

      expect(wrapper.vm.counts).toBeNull()
      expect(wrapper.vm.adoptionOpen).toBe(false)
    })
  })
})
