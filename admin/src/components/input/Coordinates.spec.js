import { mount } from '@vue/test-utils'
import Coordinates from './Coordinates.vue'
import Vue from 'vue'
import VueI18n from 'vue-i18n'
import { vi, describe, beforeEach, it, expect } from 'vitest'

Vue.use(VueI18n)

const localVue = global.localVue
const mocks = {
  $t: vi.fn((t, v) => {
    if (t === 'geo-coordinates.format') {
      return `${v.latitude}, ${v.longitude}`
    }
    return t
  }),
}

describe('Coordinates', () => {
  let wrapper
  const value = {
    latitude: 56.78,
    longitude: 12.34,
  }

  const createWrapper = (propsData) => {
    return mount(Coordinates, {
      localVue,
      mocks,
      propsData,
    })
  }

  beforeEach(() => {
    wrapper = createWrapper({ value })
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
      longitude: 78.9,
    })
  })

  it('emits input event with updated values', async () => {
    const latitudeInput = wrapper.find('#home-community-latitude')
    const longitudeInput = wrapper.find('#home-community-longitude')

    await latitudeInput.setValue('34.56')
    expect(wrapper.emitted().input).toBeTruthy()
    expect(wrapper.emitted().input[0][0]).toEqual({
      latitude: 34.56,
      longitude: 12.34,
    })

    await longitudeInput.setValue('78.90')
    expect(wrapper.emitted().input).toBeTruthy()
    expect(wrapper.emitted().input[1][0]).toEqual({
      latitude: 34.56,
      longitude: 78.9,
    })
  })

  it('splits coordinates correctly when entering in latitudeLongitude input', async () => {
    const latitudeLongitudeInput = wrapper.find('#home-community-latitude-longitude-smart')

    await latitudeLongitudeInput.setValue('34.56, 78.90')
    await latitudeLongitudeInput.trigger('input')

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
