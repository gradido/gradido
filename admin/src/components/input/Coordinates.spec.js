import { mount } from '@vue/test-utils'
import { describe, it, expect, beforeEach, vi } from 'vitest'
import Coordinates from './Coordinates.vue'
import { BFormGroup, BFormInput } from 'bootstrap-vue-next'

const modelValue = {
  latitude: 56.78,
  longitude: 12.34,
}

vi.mock('vue-i18n', () => ({
  useI18n: () => ({
    t: (key, v) => (key === 'geo-coordinates.format' ? `${v.latitude}, ${v.longitude}` : key),
  }),
}))

const mockEditableGroup = {
  valueChanged: vi.fn(function () {
    this.isValueChanged = true
  }),
  invalidValues: vi.fn(function () {
    this.isValueChanged = false
  }),
}

describe('Coordinates', () => {
  let wrapper

  const createWrapper = (props = {}) => {
    return mount(Coordinates, {
      props: {
        modelValue,
        ...props,
      },
      global: {
        stubs: {
          BFormGroup,
          BFormInput,
        },
        provide: {
          editableGroup: mockEditableGroup,
        },
      },
    })
  }

  beforeEach(() => {
    wrapper = createWrapper()
  })

  it('renders the component with initial values', () => {
    expect(wrapper.find('#home-community-latitude').element.value).toBe('56.78')
    expect(wrapper.find('#home-community-longitude').element.value).toBe('12.34')
    expect(wrapper.find('#home-community-latitude-longitude-smart').element.value).toBe(
      '56.78, 12.34',
    )
  })

  it('updates latitude and longitude when input changes', async () => {
    const latitudeInput = wrapper.find('#home-community-latitude')
    const longitudeInput = wrapper.find('#home-community-longitude')

    await latitudeInput.setValue('34.56')
    await longitudeInput.setValue('78.90')

    expect(wrapper.vm.inputValue).toStrictEqual({
      latitude: 34.56,
      longitude: '78.90',
    })
  })

  it('emits input event with updated values', async () => {
    const latitudeInput = wrapper.find('#home-community-latitude')
    const longitudeInput = wrapper.find('#home-community-longitude')

    await latitudeInput.setValue('34.56')
    expect(wrapper.emitted('input')).toBeTruthy()
    expect(wrapper.vm.inputValue.latitude).toBe('34.56')

    await longitudeInput.setValue('78.9')
    expect(wrapper.emitted('input')).toBeTruthy()
    expect(wrapper.vm.inputValue.longitude).toBe('78.9')
  })

  /**
   * ⛔ Emptying both fields means "this community has no coordinates". It used to be sent as
   * two empty strings, and the backend wrote that away as a POINT WITH NO COORDINATES --
   * which reads back as no location either, so it looked right and was not: the column has
   * a NULL for exactly this, and `updateHomeCommunity` writes it when the value is null.
   * Since 10.09.2026 the validator refuses anything that is not a pair of numbers, so two
   * empty strings would be turned away rather than quietly stored.
   */
  it('says null when both fields are emptied, not two empty strings', async () => {
    await wrapper.find('#home-community-latitude').setValue('')
    await wrapper.find('#home-community-longitude').setValue('')

    const zuletzt = wrapper.emitted('update:modelValue').at(-1)[0]
    expect(zuletzt).toBeNull()
  })

  it('still says the pair while one of the two is filled', async () => {
    await wrapper.find('#home-community-longitude').setValue('')

    const zuletzt = wrapper.emitted('update:modelValue').at(-1)[0]
    expect(zuletzt).not.toBeNull()
    expect(zuletzt.latitude).toBe(56.78)
  })

  // ⛔ The combined field read `latitude && longitude`, so a coordinate of 0 emptied it --
  // while the two numbers below it still showed the pair. The prime meridian runs through
  // the UK, France, Spain, Algeria and Ghana.
  it('shows a zero coordinate in the combined field', async () => {
    await wrapper.find('#home-community-longitude').setValue('0')

    expect(wrapper.find('#home-community-latitude-longitude-smart').element.value).toContain('0')
    expect(wrapper.emitted('update:modelValue').at(-1)[0]).not.toBeNull()
  })

  it('splits coordinates correctly when entering in latitudeLongitude input', async () => {
    const latitudeLongitudeInput = wrapper.find('#home-community-latitude-longitude-smart')

    await latitudeLongitudeInput.setValue('34.56, 78.90')
    await latitudeLongitudeInput.trigger('input')

    await wrapper.vm.$nextTick()

    expect(wrapper.vm.inputValue).toStrictEqual({
      latitude: 34.56,
      longitude: 78.9,
    })
  })

  it('validates coordinates correctly', async () => {
    const latitudeInput = wrapper.find('#home-community-latitude')
    const longitudeInput = wrapper.find('#home-community-longitude')

    await latitudeInput.setValue('invalid')
    await longitudeInput.setValue('78.90')

    expect(wrapper.vm.isValid).toBe(false)

    await latitudeInput.setValue('34.56')
    await longitudeInput.setValue('78.90')

    expect(wrapper.vm.isValid).toBe(true)
  })
})
