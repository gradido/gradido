// AI-GENERATED — not an architecture reference
import { useQuery } from '@vue/apollo-composable'
import { flushPromises, mount } from '@vue/test-utils'
import {
  BButton,
  BForm,
  BFormCheckbox,
  BFormGroup,
  BFormInput,
  BFormInvalidFeedback,
  BFormTextarea,
} from 'bootstrap-vue-next'
import { beforeEach, describe, expect, it, vi } from 'vitest'
import { ref } from 'vue'
import { createI18n } from 'vue-i18n'
import { spaceWithNameAndDescription } from '@/graphql/projectBranding.graphql'
import { ProjectBrandingForm } from './ProjectBrandingForm'

vi.mock('@vue/apollo-composable')

const branding = (overrides = {}) => ({
  id: 7,
  name: 'Gradido Garden',
  alias: 'garden',
  description: 'Where it grows',
  spaceId: null,
  spaceUrl: null,
  newUserToSpace: false,
  logoUrl: 'https://example.org/logo.png',
  ...overrides,
})

// what the modal holds is the point here, not how Bootstrap opens it
const BModal = {
  name: 'BModal',
  props: ['modelValue', 'title', 'noFooter'],
  template: '<div class="modal-stub"><slot /></div>',
}

describe('ProjectBrandingForm', () => {
  let result

  const createWrapper = (modelValue = branding()) =>
    mount(ProjectBrandingForm, {
      props: { modelValue },
      global: {
        plugins: [
          createI18n({
            legacy: false,
            locale: 'en',
            missingWarn: false,
            fallbackWarn: false,
            messages: {
              en: {
                projectBranding: {
                  selectSpace: 'select a space',
                  noAccessRightSpace: 'no right to space {spaceId}',
                  chosenSpace: 'space {space}',
                },
              },
            },
          }),
        ],
        stubs: {
          BForm,
          BButton,
          BFormGroup,
          BFormInput,
          BFormTextarea,
          BFormCheckbox,
          BFormInvalidFeedback,
          BModal,
          ListHumhubSpaces: true,
        },
      },
    })

  const field = (wrapper, name) => wrapper.find(`[name="${name}"]`)
  const submit = async (wrapper) => {
    await wrapper.find('form').trigger('submit')
    await flushPromises()
  }

  beforeEach(() => {
    vi.clearAllMocks()
    result = ref(undefined)
    useQuery.mockReturnValue({ result })
  })

  it('shows what the branding holds', () => {
    const wrapper = createWrapper()
    expect(field(wrapper, 'name').element.value).toBe('Gradido Garden')
    expect(field(wrapper, 'alias').element.value).toBe('garden')
    expect(field(wrapper, 'description').element.tagName).toBe('TEXTAREA')
    expect(field(wrapper, 'description').element.value).toBe('Where it grows')
    expect(field(wrapper, 'logoUrl').element.value).toBe('https://example.org/logo.png')
  })

  it('asks for the space only when the branding has one', () => {
    createWrapper()
    expect(useQuery).toHaveBeenCalledWith(spaceWithNameAndDescription, expect.any(Function), {
      enabled: false,
    })
    createWrapper(branding({ spaceId: 3 }))
    expect(useQuery).toHaveBeenLastCalledWith(spaceWithNameAndDescription, expect.any(Function), {
      enabled: true,
    })
    expect(useQuery.mock.lastCall[1]()).toEqual({ id: 3 })
  })

  it('says what the space button would choose', () => {
    expect(createWrapper().find('.btn-outline-secondary').text()).toBe('select a space')
    expect(
      createWrapper(branding({ spaceId: 3 }))
        .find('.btn-outline-secondary')
        .text(),
    ).toBe('no right to space 3')
    result.value = { space: { name: 'The Garden', description: 'Green' } }
    const wrapper = createWrapper(branding({ spaceId: 3 }))
    expect(wrapper.find('.btn-outline-secondary').text()).toBe('space The Garden')
    expect(wrapper.find('.btn-outline-secondary').attributes('title')).toBe('Green')
  })

  // It was titled "Select Space" in every language.
  it("the space dialog is titled in the admin's language", () => {
    const modal = createWrapper().findComponent({ name: 'BModal' })
    expect(modal.props('title')).toBe('select a space')
  })

  it('opens the list of spaces, and takes the space chosen there', async () => {
    const wrapper = createWrapper()
    const modal = wrapper.findComponent({ name: 'BModal' })
    expect(modal.props('modelValue')).toBe(false)
    expect(modal.props('noFooter')).not.toBe(undefined)
    await wrapper.find('.btn-outline-secondary').trigger('click')
    expect(modal.props('modelValue')).toBe(true)

    await wrapper
      .findComponent({ name: 'ListHumhubSpaces' })
      .vm.$emit('chooseSpace', { id: 4, url: 'https://humhub.example/s/4' })
    expect(wrapper.find('.btn-outline-secondary').text()).toBe('no right to space 4')
    expect(wrapper.findComponent({ name: 'ListHumhubSpaces' }).props('modelValue')).toBe(4)

    await submit(wrapper)
    expect(wrapper.emitted('update:modelValue')[0][0]).toMatchObject({
      spaceId: 4,
      spaceUrl: 'https://humhub.example/s/4',
    })
  })

  it('saves the edited branding with its id, without what the rules do not know', async () => {
    const wrapper = createWrapper(branding({ unknown: 'dropped' }))
    await field(wrapper, 'name').setValue('Gradido Orchard')
    await wrapper.find('input[type="checkbox"]').setValue(true)
    await submit(wrapper)
    expect(wrapper.emitted('update:modelValue')).toEqual([
      [
        {
          id: 7,
          name: 'Gradido Orchard',
          alias: 'garden',
          description: 'Where it grows',
          spaceId: null,
          spaceUrl: null,
          newUserToSpace: true,
          logoUrl: 'https://example.org/logo.png',
        },
      ],
    ])
  })

  it('shows why it does not save an invalid branding', async () => {
    const wrapper = createWrapper()
    await field(wrapper, 'alias').setValue('Not An Alias')
    await submit(wrapper)
    expect(wrapper.emitted('update:modelValue')).toBeUndefined()
    expect(wrapper.find('.invalid-feedback.d-block').text()).toBe(
      'Alias can only contain lowercase letters, numbers, hyphens, and underscores.',
    )
  })

  it('takes a saved branding back to what it was given, and forgets the error', async () => {
    const wrapper = createWrapper()
    await field(wrapper, 'alias').setValue('Not An Alias')
    await submit(wrapper)
    await wrapper.find('button[type="reset"]').trigger('click')
    expect(field(wrapper, 'alias').element.value).toBe('garden')
    expect(wrapper.find('.invalid-feedback.d-block').exists()).toBe(false)
  })

  it('empties a new branding, but keeps the error', async () => {
    const wrapper = createWrapper(branding({ id: undefined }))
    await field(wrapper, 'alias').setValue('Not An Alias')
    await submit(wrapper)
    await wrapper.find('button[type="reset"]').trigger('click')
    expect(field(wrapper, 'name').element.value).toBe('')
    expect(field(wrapper, 'alias').element.value).toBe('')
    expect(wrapper.find('.invalid-feedback.d-block').exists()).toBe(true)
  })

  it('shows a new value it is given', async () => {
    const wrapper = createWrapper()
    await wrapper.setProps({ modelValue: branding({ name: 'Renamed' }) })
    expect(field(wrapper, 'name').element.value).toBe('Renamed')
  })
})
