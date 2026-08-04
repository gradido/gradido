import { mount } from '@vue/test-utils'
import { describe, it, expect, beforeEach, vi } from 'vitest'
import GroupTags from './GroupTags.vue'

vi.mock('vue-i18n', () => ({
  useI18n: () => ({
    t: (key) => key,
  }),
}))

vi.mock('@vue/apollo-composable', () => ({
  useMutation: vi.fn(() => ({
    mutate: vi.fn(),
  })),
  useQuery: vi.fn(() => ({
    result: { value: { groupTags: [] } },
    error: { value: null },
    refetch: vi.fn(),
    onResult: vi.fn(),
    onError: vi.fn(),
  })),
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

describe('GroupTags', () => {
  let wrapper

  const createWrapper = () =>
    mount(GroupTags, {
      global: {
        stubs: {
          BFormGroup: mockBFormGroup,
          BFormInput: mockBFormInput,
          BButton: mockBButton,
        },
        mocks: {
          $t: (key) => key,
        },
      },
    })

  beforeEach(() => {
    vi.clearAllMocks()
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
})
