// AI-GENERATED — not an architecture reference
import { flushPromises, mount } from '@vue/test-utils'
import { BButton, BCol, BForm, BFormGroup, BRow } from 'bootstrap-vue-next'
import { beforeEach, describe, expect, it, vi } from 'vitest'
import { __choice } from '@/composables/useCreationGroupChoice'
import { SupportForm } from './SupportForm'

const mockMutate = vi.fn()
const mockToastSuccess = vi.fn()
const mockToastError = vi.fn()

vi.mock('@vue/apollo-composable', () => ({ useMutation: () => ({ mutate: mockMutate }) }))
vi.mock('vue-i18n', () => ({
  useI18n: () => ({ t: (key, values) => (values ? `${key} ${JSON.stringify(values)}` : key) }),
}))
vi.mock('@/composables/useToast', () => ({
  useAppToast: () => ({ toastSuccess: mockToastSuccess, toastError: mockToastError }),
}))
// The group field is the contribution form's (useCreationGroupChoice has its own spec there).
vi.mock('@/composables/useCreationGroupChoice', async () => {
  const { ref } = await import('vue')
  const choice = { selected: ref(''), options: ref([]), selectedLabel: ref('') }
  return { useCreationGroupChoice: () => choice, __choice: choice }
})
vi.mock('@/components/Inputs/ValidatedInput.vue', () => ({
  default: {
    name: 'ValidatedInput',
    props: ['modelValue', 'maxlength', 'label', 'placeholder', 'rules', 'name', 'textarea'],
    emits: ['update:modelValue'],
    template:
      '<textarea :maxlength="maxlength" :value="modelValue" @input="$emit(\'update:modelValue\', $event.target.value)" />',
  },
}))
vi.mock('@/components/ThemedSelect.vue', () => ({
  default: { name: 'ThemedSelect', props: ['modelValue', 'options'], template: '<select />' },
}))

const mountForm = () =>
  mount(SupportForm, { global: { components: { BButton, BCol, BForm, BFormGroup, BRow } } })

const sendButton = (wrapper) => wrapper.find('[data-test="support-send"]')

describe('SupportForm', () => {
  beforeEach(() => {
    vi.clearAllMocks()
    __choice.selected.value = ''
    __choice.selectedLabel.value = ''
  })

  it('says who reads the request, by the group chosen', async () => {
    const wrapper = mountForm()
    expect(wrapper.text()).toContain('support.readBy.none')
    __choice.selected.value = 'garden'
    __choice.selectedLabel.value = 'Garten'
    await flushPromises()
    expect(wrapper.text()).toContain('support.readBy.group {"group":"Garten"}')
  })

  it('stops the field at the length of a message', () => {
    expect(mountForm().find('textarea').attributes('maxlength')).toBe('5000')
  })

  it('sends nothing until there are enough words', async () => {
    const wrapper = mountForm()
    await wrapper.find('textarea').setValue('Hilf')
    expect(sendButton(wrapper).attributes('disabled')).toBeDefined()
    await wrapper.find('textarea').setValue('Hilfe!')
    expect(sendButton(wrapper).attributes('disabled')).toBeUndefined()
  })

  it('files the request in the group chosen, says so, and moves on', async () => {
    mockMutate.mockResolvedValue({ data: { createSupportTicket: { id: 12 } } })
    __choice.selected.value = 'garden'
    const wrapper = mountForm()
    await wrapper.find('textarea').setValue('Wie schöpfe ich?')
    await wrapper.find('form').trigger('submit')
    await flushPromises()
    expect(mockMutate).toHaveBeenCalledWith({
      text: 'Wie schöpfe ich?',
      creationGroupTag: 'garden',
    })
    expect(mockToastSuccess).toHaveBeenCalledWith('support.sent')
    expect(wrapper.emitted('sent')).toHaveLength(1)
    expect(wrapper.find('textarea').element.value).toBe('')
  })

  it('sends once, however often it is pressed while it sends, and is closed meanwhile', async () => {
    let done
    mockMutate.mockImplementation(() => new Promise((resolve) => (done = resolve)))
    const wrapper = mountForm()
    await wrapper.find('textarea').setValue('Wie schöpfe ich?')
    await wrapper.find('form').trigger('submit')
    expect(sendButton(wrapper).attributes('disabled')).toBeDefined()
    await wrapper.find('form').trigger('submit')
    done({ data: { createSupportTicket: { id: 12 } } })
    await flushPromises()
    expect(mockMutate).toHaveBeenCalledTimes(1)
  })

  it('files a request without a group as one for the community', async () => {
    mockMutate.mockResolvedValue({ data: { createSupportTicket: { id: 12 } } })
    const wrapper = mountForm()
    await wrapper.find('textarea').setValue('Wie schöpfe ich?')
    await wrapper.find('form').trigger('submit')
    await flushPromises()
    expect(mockMutate).toHaveBeenCalledWith({ text: 'Wie schöpfe ich?', creationGroupTag: null })
  })

  it('words a refusal, and keeps the words', async () => {
    mockMutate.mockRejectedValue(new Error('SUPPORT_TICKETS_PER_DAY_REACHED'))
    const wrapper = mountForm()
    await wrapper.find('textarea').setValue('Wie schöpfe ich?')
    await wrapper.find('form').trigger('submit')
    await flushPromises()
    expect(mockToastError).toHaveBeenCalledWith('support.perDayReached {"max":10}')
    expect(wrapper.emitted('sent')).toBeUndefined()
    expect(wrapper.find('textarea').element.value).toBe('Wie schöpfe ich?')
  })

  it('empties the words with "Abbrechen"', async () => {
    const wrapper = mountForm()
    await wrapper.find('textarea').setValue('Wie schöpfe ich?')
    await wrapper.find('form').trigger('reset')
    expect(wrapper.find('textarea').element.value).toBe('')
  })
})
