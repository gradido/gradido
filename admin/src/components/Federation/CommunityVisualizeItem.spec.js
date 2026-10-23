// import { createMockClient } from 'mock-apollo-client'
// import { mount } from '@vue/test-utils'
// import VueApollo from 'vue-apollo'
// import Vuex from 'vuex'
// import CommunityVisualizeItem from './CommunityVisualizeItem.vue'
// import { updateHomeCommunity } from '../../graphql/updateHomeCommunity'
// import { toastSuccessSpy } from '../../../test/testSetup'
//
// const mockClient = createMockClient()
// const apolloProvider = new VueApollo({
//   defaultClient: mockClient,
// })
//
// const localVue = global.localVue
// localVue.use(Vuex)
// localVue.use(VueApollo)
// const today = new Date()
// const createdDate = new Date()
// createdDate.setDate(createdDate.getDate() - 3)
//
// // Mock für den Vuex-Store
// const store = new Vuex.Store({
//   state: {
//     moderator: {
//       role: 'ADMIN',
//     },
//   },
// })
//
// let propsData = {
//   item: {
//     uuid: 1,
//     foreign: false,
//     url: 'http://localhost/api/',
//     publicKey: '4007170edd8d33fb009cd99ee4e87f214e7cd21b668d45540a064deb42e243c2',
//     communityUuid: '5ab0befd-b150-4f31-a631-7f3637e47b21',
//     authenticatedAt: null,
//     name: 'Gradido Test',
//     description: 'Gradido Community zum testen',
//     gmsApiKey: '<api key>',
//     creationDate: createdDate,
//     createdAt: createdDate,
//     updatedAt: createdDate,
//     federatedCommunities: [
//       {
//         id: 2046,
//         apiVersion: '2_0',
//         endPoint: 'http://localhost/api/',
//         lastAnnouncedAt: createdDate,
//         verifiedAt: today,
//         lastErrorAt: null,
//         createdAt: createdDate,
//         updatedAt: null,
//       },
//       {
//         id: 2045,
//         apiVersion: '1_1',
//         endPoint: 'http://localhost/api/',
//         lastAnnouncedAt: null,
//         verifiedAt: null,
//         lastErrorAt: null,
//         createdAt: '2024-01-16T10:08:21.550Z',
//         updatedAt: null,
//       },
//       {
//         id: 2044,
//         apiVersion: '1_0',
//         endPoint: 'http://localhost/api/',
//         lastAnnouncedAt: null,
//         verifiedAt: null,
//         lastErrorAt: null,
//         createdAt: '2024-01-16T10:08:21.544Z',
//         updatedAt: null,
//       },
//     ],
//   },
// }
//
// const mocks = {
//   $t: (key) => key,
//   $i18n: {
//     locale: 'en',
//   },
// }
//
// describe('CommunityVisualizeItem', () => {
//   let wrapper
//
//   const updateHomeCommunityMock = jest.fn()
//   mockClient.setRequestHandler(
//     updateHomeCommunity,
//     updateHomeCommunityMock.mockResolvedValue({
//       data: {
//         updateHomeCommunity: { id: 1 },
//       },
//     }),
//   )
//
//   const Wrapper = () => {
//     return mount(CommunityVisualizeItem, { localVue, mocks, propsData, store, apolloProvider })
//   }
//
//   describe('mount', () => {
//     beforeEach(() => {
//       wrapper = Wrapper()
//     })
//
//     it('renders the component', () => {
//       expect(wrapper.exists()).toBe(true)
//       expect(wrapper.find('div.community-visualize-item').exists()).toBe(true)
//       expect(wrapper.find('.details').exists()).toBe(false)
//     })
//
//     it('toggles details on click', async () => {
//       // Click the row to toggle details
//       await wrapper.find('.row').trigger('click')
//
//       // Assert that details are now open
//       expect(wrapper.find('.details').exists()).toBe(true)
//
//       // Click the row again to toggle details back
//       await wrapper.find('.row').trigger('click')
//
//       // Assert that details are now closed
//       expect(wrapper.find('.details').exists()).toBe(false)
//     })
//
//     describe('rendering item properties', () => {
//       it('has the url', () => {
//         expect(wrapper.find('.row > div:nth-child(2) > div > a').text()).toBe(
//           'http://localhost/api/',
//         )
//       })
//
//       it('has the public key', () => {
//         expect(wrapper.find('.row > div:nth-child(2) > small').text()).toContain(
//           '4007170edd8d33fb009cd99ee4e87f214e7cd21b668d45540a064deb42e243c2'.substring(0, 26),
//         )
//       })
//
//       describe('verified item', () => {
//         it('has the check icon', () => {
//           expect(wrapper.find('svg.bi-check').exists()).toBe(true)
//         })
//
//         it('has the text variant "success"', () => {
//           expect(wrapper.find('.text-success').exists()).toBe(true)
//         })
//       })
//
//       // describe('with different locales (de, en, fr, es, nl)', () => {
//       describe('lastAnnouncedAt', () => {
//         it('computes the time string for different locales (de, en, fr, es, nl)', () => {
//           wrapper.vm.$i18n.locale = 'de'
//           wrapper = Wrapper()
//           expect(wrapper.vm.lastAnnouncedAt).toBe('vor 3 Tagen')
//
//           wrapper.vm.$i18n.locale = 'fr'
//           wrapper = Wrapper()
//           expect(wrapper.vm.lastAnnouncedAt).toBe('il y a 3 jours')
//
//           wrapper.vm.$i18n.locale = 'es'
//           wrapper = Wrapper()
//           expect(wrapper.vm.lastAnnouncedAt).toBe('hace 3 días')
//
//           wrapper.vm.$i18n.locale = 'nl'
//           wrapper = Wrapper()
//           expect(wrapper.vm.lastAnnouncedAt).toBe('3 dagen geleden')
//         })
//
//         describe('lastAnnouncedAt == null', () => {
//           beforeEach(() => {
//             propsData = {
//               item: {
//                 uuid: 7590,
//                 foreign: false,
//                 publicKey: 'eaf6a426b24fd54f8fbae11c17700fc595080ca25159579c63d38dbc64284ba7',
//                 url: 'http://localhost/api/2_0',
//                 lastAnnouncedAt: null,
//                 verifiedAt: null,
//                 lastErrorAt: null,
//                 createdAt: createdDate,
//                 updatedAt: null,
//               },
//             }
//             wrapper = Wrapper()
//           })
//
//           it('computes empty string', async () => {
//             expect(wrapper.vm.lastAnnouncedAt).toBe('')
//           })
//         })
//       })
//
//       describe('createdAt', () => {
//         it('computes the time string for different locales (de, en, fr, es, nl)', () => {
//           wrapper.vm.$i18n.locale = 'de'
//           wrapper = Wrapper()
//           expect(wrapper.vm.createdAt).toBe('vor 3 Tagen')
//
//           wrapper.vm.$i18n.locale = 'fr'
//           wrapper = Wrapper()
//           expect(wrapper.vm.createdAt).toBe('il y a 3 jours')
//
//           wrapper.vm.$i18n.locale = 'es'
//           wrapper = Wrapper()
//           expect(wrapper.vm.createdAt).toBe('hace 3 días')
//
//           wrapper.vm.$i18n.locale = 'nl'
//           wrapper = Wrapper()
//           expect(wrapper.vm.createdAt).toBe('3 dagen geleden')
//         })
//
//         describe('not verified item', () => {
//           beforeEach(() => {
//             propsData = {
//               item: {
//                 uuid: 7590,
//                 foreign: false,
//                 publicKey: 'eaf6a426b24fd54f8fbae11c17700fc595080ca25159579c63d38dbc64284ba7',
//                 url: 'http://localhost/api/',
//                 createdAt: createdDate,
//                 updatedAt: null,
//               },
//             }
//             wrapper = Wrapper()
//           })
//
//           it('has the x-circle icon', () => {
//             expect(wrapper.find('svg.bi-x-circle').exists()).toBe(true)
//           })
//
//           it('has the text variant "danger"', () => {
//             expect(wrapper.find('.text-danger').exists()).toBe(true)
//           })
//         })
//
//         describe('createdAt == null', () => {
//           beforeEach(() => {
//             propsData = {
//               item: {
//                 uuid: 7590,
//                 foreign: false,
//                 publicKey: 'eaf6a426b24fd54f8fbae11c17700fc595080ca25159579c63d38dbc64284ba7',
//                 url: 'http://localhost/api/2_0',
//                 communityUuid: '5ab0befd-b150-4f31-a631-7f3637e47b21',
//                 authenticatedAt: null,
//                 creationDate: null,
//                 createdAt: null,
//                 updatedAt: null,
//               },
//             }
//             wrapper = Wrapper()
//           })
//
//           it('computes empty string', async () => {
//             expect(wrapper.vm.createdAt).toBe('')
//           })
//         })
//
//         describe('test handleUpdateHomeCommunity', () => {
//           describe('gms api key', () => {
//             beforeEach(async () => {
//               wrapper = Wrapper()
//               wrapper.vm.originalGmsApiKey = 'original'
//               wrapper.vm.gmsApiKey = 'changed key'
//
//               await wrapper.vm.handleUpdateHomeCommunity()
//               // Wait for the next tick to allow async operations to complete
//               await wrapper.vm.$nextTick()
//             })
//
//             it('expect changed gms api key', () => {
//               expect(updateHomeCommunityMock).toBeCalledWith({
//                 uuid: propsData.item.uuid,
//                 gmsApiKey: 'changed key',
//                 location: undefined,
//               })
//               expect(wrapper.vm.originalGmsApiKey).toBe('changed key')
//               expect(toastSuccessSpy).toBeCalledWith('federation.toast_gmsApiKeyUpdated')
//             })
//           })
//
//           describe('location', () => {
//             beforeEach(async () => {
//               wrapper = Wrapper()
//               wrapper.vm.originalLocation = { latitude: 15.121, longitude: 1.212 }
//               wrapper.vm.location = { latitude: 1.121, longitude: 17.212 }
//
//               await wrapper.vm.handleUpdateHomeCommunity()
//               // Wait for the next tick to allow async operations to complete
//               await wrapper.vm.$nextTick()
//             })
//
//             it('expect changed location', () => {
//               expect(updateHomeCommunityMock).toBeCalledWith({
//                 uuid: propsData.item.uuid,
//                 location: { latitude: 1.121, longitude: 17.212 },
//                 gmsApiKey: undefined,
//               })
//               expect(wrapper.vm.originalLocation).toStrictEqual({
//                 latitude: 1.121,
//                 longitude: 17.212,
//               })
//               expect(toastSuccessSpy).toBeCalledWith('federation.toast_gmsLocationUpdated')
//             })
//           })
//
//           describe('gms api key and location', () => {
//             beforeEach(async () => {
//               wrapper = Wrapper()
//               wrapper.vm.originalGmsApiKey = 'original'
//               wrapper.vm.gmsApiKey = 'changed key'
//               wrapper.vm.originalLocation = { latitude: 15.121, longitude: 1.212 }
//               wrapper.vm.location = { latitude: 1.121, longitude: 17.212 }
//
//               await wrapper.vm.handleUpdateHomeCommunity()
//               // Wait for the next tick to allow async operations to complete
//               await wrapper.vm.$nextTick()
//             })
//
//             it('expect changed gms api key and changed location', () => {
//               expect(updateHomeCommunityMock).toBeCalledWith({
//                 uuid: propsData.item.uuid,
//                 gmsApiKey: 'changed key',
//                 location: undefined,
//               })
//               expect(wrapper.vm.originalGmsApiKey).toBe('changed key')
//               expect(wrapper.vm.originalLocation).toStrictEqual({
//                 latitude: 1.121,
//                 longitude: 17.212,
//               })
//               expect(toastSuccessSpy).toBeCalledWith('federation.toast_gmsApiKeyAndLocationUpdated')
//             })
//           })
//         })
//
//         describe('test resetHomeCommunityEditable', () => {
//           beforeEach(async () => {
//             wrapper = Wrapper()
//           })
//
//           it('test', () => {
//             wrapper.vm.originalGmsApiKey = 'original'
//             wrapper.vm.gmsApiKey = 'changed key'
//             wrapper.vm.originalLocation = { latitude: 15.121, longitude: 1.212 }
//             wrapper.vm.location = { latitude: 1.121, longitude: 17.212 }
//             wrapper.vm.resetHomeCommunityEditable()
//
//             expect(wrapper.vm.location).toStrictEqual({ latitude: 15.121, longitude: 1.212 })
//             expect(wrapper.vm.gmsApiKey).toBe('original')
//           })
//         })
//       })
//     })
//   })
// })

import { flushPromises, mount } from '@vue/test-utils'
import {
  BButton,
  BCol,
  BFormGroup,
  BListGroup,
  BListGroupItem,
  BRow,
  createBootstrap,
  vBTooltip,
} from 'bootstrap-vue-next'
import { formatDistanceToNow } from 'date-fns'
import { de, enUS as en, es, fr, nl } from 'date-fns/locale'
import { beforeEach, describe, expect, it, vi } from 'vitest'
import { nextTick, ref } from 'vue'
import { useI18n } from 'vue-i18n'
import { adminStore } from '../../../test/adminStore'
import { CommunityVisualizeItem } from './CommunityVisualizeItem'

vi.mock('@/composables/useToast', () => ({
  useAppToast: vi.fn(() => ({
    toastSuccess: vi.fn(),
    toastError: vi.fn(),
  })),
}))

vi.mock('vue-i18n', () => ({
  useI18n: vi.fn(() => ({
    locale: ref('en'),
    t: (key) => key,
  })),
}))

const mockMutate = vi.fn().mockResolvedValue({ data: { updateHomeCommunity: { id: 1 } } })
vi.mock('@vue/apollo-composable', () => ({
  useMutation: vi.fn(() => ({
    mutate: mockMutate,
  })),
}))

const today = new Date()
const createdDate = new Date(today)
createdDate.setDate(createdDate.getDate() - 3)

const createItem = (overrides = {}) => ({
  uuid: 1,
  foreign: false,
  url: 'http://localhost/api/',
  publicKey: '4007170edd8d33fb009cd99ee4e87f214e7cd21b668d45540a064deb42e243c2',
  communityUuid: '5ab0befd-b150-4f31-a631-7f3637e47b21',
  authenticatedAt: null,
  name: 'Gradido Test',
  description: 'Gradido Community zum testen',
  gmsApiKey: '<api key>',
  creationDate: createdDate,
  createdAt: createdDate,
  updatedAt: createdDate,
  federatedCommunities: [
    {
      id: 2046,
      apiVersion: '2_0',
      endPoint: 'http://localhost/api/',
      lastAnnouncedAt: createdDate,
      verifiedAt: today,
      lastErrorAt: null,
      createdAt: createdDate,
      updatedAt: null,
    },
    {
      id: 2045,
      apiVersion: '1_1',
      endPoint: 'http://localhost/api/',
      lastAnnouncedAt: null,
      verifiedAt: null,
      lastErrorAt: null,
      createdAt: '2024-01-16T10:08:21.550Z',
      updatedAt: null,
    },
    {
      id: 2044,
      apiVersion: '1_0',
      endPoint: 'http://localhost/api/',
      lastAnnouncedAt: null,
      verifiedAt: null,
      lastErrorAt: null,
      createdAt: '2024-01-16T10:08:21.544Z',
      updatedAt: null,
    },
  ],
  ...overrides,
})

describe('CommunityVisualizeItem', () => {
  let wrapper
  let store
  let mockI18n

  const createWrapper = (props = {}, locale = 'en') => {
    store = adminStore({
      moderator: {
        role: 'ADMIN',
      },
    })

    mockI18n = {
      locale: ref(locale),
      t: (key) => key,
    }
    vi.mocked(useI18n).mockReturnValue(mockI18n)

    return mount(CommunityVisualizeItem, {
      props: {
        item: createItem(),
        ...props,
      },
      global: {
        plugins: [store, createBootstrap()],
        mocks: {
          $t: (key) => key,
          $i18n: {
            locale,
          },
        },
        stubs: {
          BRow,
          BCol,
          BListGroup,
          BListGroupItem,
          BFormGroup,
          BButton,
          'variant-icon': true,
          'editable-groupable-label': true,
          coordinates: true,
          'federation-visualize-item': true,
        },
        // in the build the resolver imports it where the template names it
        directives: {
          'b-tooltip': vBTooltip,
        },
      },
    })
  }

  const columns = () => wrapper.findAll('.community-visualize-item > .row:first-child > div')
  // The value of a column, without the small name a phone shows above it (`d-lg-none`).
  const valueIn = (column) => {
    const label = column.find('.d-lg-none')
    return label.exists() ? column.text().slice(label.text().length).trim() : column.text()
  }

  beforeEach(() => {
    vi.clearAllMocks()
    wrapper = createWrapper()
  })

  it('renders the component', () => {
    expect(wrapper.exists()).toBe(true)
    expect(wrapper.find('div.community-visualize-item').exists()).toBe(true)
    expect(wrapper.find('.details').exists()).toBe(false)
  })

  it('toggles details on click', async () => {
    await wrapper.find('.row').trigger('click')
    expect(wrapper.find('.details').exists()).toBe(true)

    await wrapper.find('.row').trigger('click')
    expect(wrapper.find('.details').exists()).toBe(false)
  })

  describe('rendering item properties', () => {
    it('has the url', () => {
      expect(wrapper.find('.row > div:nth-child(2) > div > a').text()).toBe('http://localhost/api/')
    })

    it('has the public key', () => {
      expect(wrapper.find('.row > div:nth-child(2) > small').text()).toContain(
        '4007170edd8d33fb009cd99ee4e87f214e7cd21b668d45540a064deb42e243c2'.substring(0, 26),
      )
    })

    describe('verified item', () => {
      it('has the check icon', () => {
        expect(wrapper.find('variant-icon-stub[icon="check"]').exists()).toBe(true)
      })

      it('has the text variant "success"', () => {
        expect(wrapper.find('variant-icon-stub[variant="success"]').exists()).toBe(true)
      })
    })

    describe('lastAnnouncedAt', () => {
      it.each([
        ['en', en],
        ['de', de],
        ['fr', fr],
        ['es', es],
        ['nl', nl],
      ])('computes the time string for %s locale', async (locale, dateLocale) => {
        wrapper = createWrapper(
          {
            item: createItem(),
          },
          locale,
        )

        await nextTick()

        const expectedString = formatDistanceToNow(createdDate, {
          addSuffix: true,
          locale: dateLocale,
        })
        expect(valueIn(columns()[3])).toBe(expectedString)
      })

      it('computes empty string when lastAnnouncedAt is null', () => {
        wrapper = createWrapper({ item: createItem({ federatedCommunities: [] }) })
        expect(valueIn(columns()[3])).toBe('')
      })
    })

    describe('createdAt', () => {
      it.each([
        ['en', en],
        ['de', de],
        ['fr', fr],
        ['es', es],
        ['nl', nl],
      ])('computes the time string for %s locale', async (locale, dateLocale) => {
        wrapper = createWrapper(
          {
            item: createItem(),
          },
          locale,
        )

        await nextTick()

        const expectedString = formatDistanceToNow(createdDate, {
          addSuffix: true,
          locale: dateLocale,
        })
        expect(valueIn(columns()[4])).toBe(expectedString)
      })

      it('computes empty string when createdAt is null', () => {
        wrapper = createWrapper({ item: createItem({ createdAt: null }) })
        expect(valueIn(columns()[4])).toBe('')
      })
    })
  })

  // On a phone a community is a card: every column takes the whole width, and a value carries a
  // small name of its own; from 992px on the columns of before, under the head of the list.
  it('every value carries its small label below the boundary', () => {
    const label = (column) => column.find('.d-lg-none')
    expect(columns().map((column) => column.classes().sort())).toEqual([
      ['col-12', 'col-lg-1'],
      ['col-12', 'col-lg', 'text-break'],
      ['col-12', 'col-lg'],
      ['col-12', 'col-lg-2'],
      ['col-12', 'col-lg-2'],
    ])
    expect(columns().map((column) => label(column).text())).toEqual([
      'federation.verified',
      'federation.url',
      'federation.name',
      'federation.lastAnnouncedAt',
      'federation.createdAt',
    ])
    for (const column of columns()) {
      expect(label(column).classes()).toEqual(
        expect.arrayContaining(['d-block', 'd-lg-none', 'small', 'text-body-secondary']),
      )
      expect(column.element.firstElementChild).toBe(label(column).element)
    }
  })

  describe('opened', () => {
    const nestedHead = () => wrapper.find('.details .list-group-item .list-group > .row')

    // Six heads over the six cells of a federation: "API Version" stood twice, and every head
    // after it stood one cell to the right of its cell.
    it('the nested header has six columns', async () => {
      await wrapper.find('.row').trigger('click')
      expect(
        nestedHead()
          .findAll(':scope > div')
          .map((column) => column.text()),
      ).toEqual([
        'federation.verified',
        'federation.apiVersion',
        'federation.createdAt',
        'federation.lastAnnouncedAt',
        'federation.verifiedAt',
        'federation.lastErrorAt',
      ])
      // ... from 992px on, as the head of the list.
      expect(nestedHead().classes()).toEqual(expect.arrayContaining(['d-none', 'd-lg-flex']))
    })

    // A key is one word: the opened home community was 698px wide at 320px.
    it('long keys may break', async () => {
      wrapper = createWrapper({
        item: createItem({ foreign: true, hieroTopicId: '0.0.4815162342' }),
      })
      await wrapper.find('.row').trigger('click')
      const lines = wrapper.findAll('.details > div > .list-group > .list-group-item')
      const line = (key) => lines.find((item) => item.text().startsWith(key))
      for (const key of [
        'federation.communityUuid',
        'federation.publicKey',
        'federation.hieroTopicId',
      ]) {
        expect(line(key)?.classes(), key).toContain('text-break')
      }
    })
  })

  describe('not verified item', () => {
    beforeEach(() => {
      wrapper = createWrapper({
        item: createItem({ federatedCommunities: [] }),
      })
    })

    it('has the x-circle icon', () => {
      expect(wrapper.find('variant-icon-stub[icon="x-circle"]').exists()).toBe(true)
    })

    it('has the text variant "danger"', () => {
      expect(wrapper.find('variant-icon-stub[variant="danger"]').exists()).toBe(true)
    })
  })

  // The fields of the home community sit in the edit slot of the EditableGroup, which opens
  // with the details. They are stubs here, so the group never hears of a change and keeps its
  // save button disabled -- the save is therefore asked of the group directly.
  describe('editing the home community', () => {
    const openEditing = async () => {
      await wrapper.find('.row').trigger('click')
      await wrapper.findComponent({ name: 'EditableGroup' }).find('button').trigger('click')
    }
    const labels = () => wrapper.findAllComponents({ name: 'EditableGroupableLabel' })
    const coordinates = () => wrapper.findComponent({ name: 'Coordinates' })
    const save = async () => {
      wrapper.findComponent({ name: 'EditableGroup' }).vm.$emit('save')
      await flushPromises()
    }

    beforeEach(async () => {
      wrapper = createWrapper()
      await openEditing()
    })

    it('hands the fields what the community has', () => {
      expect(labels().map((label) => label.props('modelValue'))).toEqual(['<api key>', null])
      expect(labels().map((label) => label.props('idName'))).toEqual([
        'home-community-api-key',
        'home-community-hiero-topic-id',
      ])
    })

    it('updates gms api key', async () => {
      await labels()[0].vm.$emit('update:modelValue', 'changed key')
      await save()

      expect(mockMutate).toHaveBeenCalledWith({
        uuid: 1,
        gmsApiKey: 'changed key',
      })
    })

    it('updates location', async () => {
      await coordinates().vm.$emit('update:modelValue', { latitude: 1.121, longitude: 17.212 })
      await save()

      expect(mockMutate).toHaveBeenCalledWith({
        uuid: 1,
        location: { latitude: 1.121, longitude: 17.212 },
        gmsApiKey: '<api key>',
      })
    })

    it('updates both gms api key and location', async () => {
      await labels()[0].vm.$emit('update:modelValue', 'changed key')
      await coordinates().vm.$emit('update:modelValue', { latitude: 1.121, longitude: 17.212 })
      await save()

      expect(mockMutate).toHaveBeenCalledWith({
        uuid: 1,
        gmsApiKey: 'changed key',
        location: { latitude: 1.121, longitude: 17.212 },
      })
    })

    it('shows the saved values once the group is closed', async () => {
      await labels()[0].vm.$emit('update:modelValue', 'changed key')
      await save()
      await wrapper.find('.close-button').trigger('click')

      expect(wrapper.find('.details').text()).toContain('changed key')
    })

    it('resets gms api key and location', async () => {
      await labels()[0].vm.$emit('update:modelValue', 'changed key')
      await coordinates().vm.$emit('update:modelValue', { latitude: 1.121, longitude: 17.212 })
      await wrapper.find('.close-button').trigger('click')

      expect(wrapper.find('.details').text()).toContain('<api key>')
      expect(wrapper.find('.details').text()).not.toContain('changed key')
      expect(wrapper.find('.details').text()).not.toContain('geo-coordinates.format')
    })
  })
})
