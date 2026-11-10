// AI-GENERATED — not an architecture reference
import { flushPromises, mount } from '@vue/test-utils'
import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest'
import i18n from '@/i18n'
import { KeptPictureWindow } from './KeptPictureWindow'
import {
  forgetKeptPictures,
  hasKeptPicture,
  setKeptPicture,
  startKeptPictures,
} from '@/composables/useKeptPictures'
import { forgetAllMemberAvatars, rememberMemberAvatars } from '@/composables/useMemberAvatars'

const mockQuery = vi.fn()
const mockMutate = vi.fn()
vi.mock('@vue/apollo-composable', () => ({
  useApolloClient: () => ({
    client: { query: (...args) => mockQuery(...args), mutate: (...args) => mockMutate(...args) },
  }),
}))

const mockToastSuccess = vi.fn()
const mockToastError = vi.fn()
vi.mock('@/composables/useToast', () => ({
  useAppToast: () => ({ toastSuccess: mockToastSuccess, toastError: mockToastError }),
}))

const HOME = '11111111-1111-4111-8111-111111111111'
const MONDAY = '2026-08-17T10:00:00.000Z'
const ANNA = { communityUuid: HOME, gradidoID: 'aaaa-anna', alias: 'Anna-Sonne' }

/** The cropper as far as the window uses it: its props, its two events, the pictures above it. */
const CropperStub = {
  name: 'AvatarCropper',
  props: ['modelValue', 'hasAvatar', 'stacked', 'title', 'note', 'removeQuestion', 'removeLabel'],
  emits: ['update:modelValue', 'saved', 'removed'],
  template: '<div class="cropper-stub"><slot name="pictures" /></div>',
}

describe('KeptPictureWindow', () => {
  let wrapper

  const mountWindow = (member = ANNA) => {
    wrapper = mount(KeptPictureWindow, {
      props: { modelValue: true, member, name: 'Anna-Sonne' },
      global: { plugins: [i18n], stubs: { AvatarCropper: CropperStub } },
    })
    return wrapper
  }
  const cropper = () => wrapper.findComponent({ name: 'AvatarCropper' })

  const keepAnna = async () => {
    startKeptPictures('me', HOME)
    await setKeptPicture({ mutate: () => Promise.resolve({ data: {} }) }, ANNA, {
      small: 'mine',
      full: 'mine-full',
    })
  }

  beforeEach(() => {
    i18n.global.locale.value = 'de'
    mockQuery.mockReset().mockResolvedValue({ data: { keptPictures: [] } })
    mockMutate.mockReset().mockResolvedValue({ data: {} })
    mockToastSuccess.mockReset()
    mockToastError.mockReset()
    localStorage.clear()
    forgetKeptPictures()
    forgetAllMemberAvatars()
  })

  afterEach(() => {
    wrapper?.unmount()
  })

  it('opens the cropper over the contact window, in the words of a picture of somebody', () => {
    mountWindow()

    expect(cropper().props()).toMatchObject({
      modelValue: true,
      stacked: true,
      hasAvatar: false,
      title: 'Dein Bild von Anna-Sonne',
      note: 'Nur Du siehst es.',
      removeLabel: 'Mein Bild entfernen',
    })
  })

  it('asks for the pictures when it opens -- the retry where the first request failed', async () => {
    startKeptPictures('me', HOME)
    mountWindow()
    await flushPromises()

    expect(mockQuery).toHaveBeenCalled()
  })

  it('says what comes back after removing: her own picture, or her letters', async () => {
    await keepAnna()
    mountWindow({ ...ANNA, avatarUpdatedAt: null })
    expect(cropper().props('removeQuestion')).toBe(
      'Dann siehst Du wieder die Anfangsbuchstaben von Anna-Sonne.',
    )
    wrapper.unmount()

    rememberMemberAvatars([{ ...ANNA, avatar: 'her-own', avatarUpdatedAt: MONDAY }])
    mountWindow({ ...ANNA, avatarUpdatedAt: MONDAY })
    expect(cropper().props('removeQuestion')).toBe(
      'Dann siehst Du wieder das Bild, das Anna-Sonne gewählt hat.',
    )
  })

  it('shows both pictures, each named for whose it is', async () => {
    await keepAnna()
    rememberMemberAvatars([{ ...ANNA, avatar: 'her-own', avatarUpdatedAt: MONDAY }])
    mountWindow({ ...ANNA, avatarUpdatedAt: MONDAY })

    const mine = wrapper.find('[data-test="kept-picture-mine"]')
    const theirs = wrapper.find('[data-test="kept-picture-theirs"]')
    expect(mine.text()).toBe('Dein Bild')
    expect(mine.find('img').attributes('src')).toBe('data:image/jpeg;base64,mine')
    expect(theirs.text()).toBe('Von Anna-Sonne gewählt')
    expect(theirs.find('img').attributes('src')).toBe('data:image/jpeg;base64,her-own')
    expect(cropper().props('hasAvatar')).toBe(true)
  })

  it('shows no pictures above the frame where there are none', () => {
    mountWindow()

    expect(wrapper.find('[data-test="kept-picture-mine"]').exists()).toBe(false)
    expect(wrapper.find('[data-test="kept-picture-theirs"]').exists()).toBe(false)
  })

  it('keeps the picture chosen, on the server first, and says nothing', async () => {
    startKeptPictures('me', HOME)
    mountWindow()

    cropper().vm.$emit('saved', { small: 'S', full: 'F' })
    await flushPromises()

    expect(mockMutate).toHaveBeenCalledWith(
      expect.objectContaining({
        variables: {
          ref: { gradidoID: ANNA.gradidoID, communityUuid: HOME },
          pictureSmall: 'S',
          pictureFull: 'F',
        },
      }),
    )
    expect(hasKeptPicture(ANNA)).toBe(true)
    expect(mockToastSuccess).not.toHaveBeenCalled()
    expect(mockToastError).not.toHaveBeenCalled()
  })

  it('names the limit where the member keeps as many pictures as they may', async () => {
    startKeptPictures('me', HOME)
    mockMutate.mockRejectedValue(new Error('GraphQL error: KEPT_PICTURES_FULL'))
    mountWindow()

    cropper().vm.$emit('saved', { small: 'S', full: 'F' })
    await flushPromises()

    expect(mockToastError).toHaveBeenCalledWith(
      'Du hast schon von 100 Menschen ein eigenes Bild. Entferne eines, um ein neues zu setzen.',
    )
    expect(hasKeptPicture(ANNA)).toBe(false)
  })

  it('says that it did not work where saving failed otherwise', async () => {
    startKeptPictures('me', HOME)
    mockMutate.mockRejectedValue(new Error('offline'))
    mountWindow()

    cropper().vm.$emit('saved', { small: 'S', full: 'F' })
    await flushPromises()

    expect(mockToastError).toHaveBeenCalledWith(
      'Das hat nicht geklappt. Bitte versuche es noch einmal.',
    )
  })

  it('takes the picture away and says so', async () => {
    await keepAnna()
    mountWindow()

    cropper().vm.$emit('removed')
    await flushPromises()

    expect(hasKeptPicture(ANNA)).toBe(false)
    expect(mockToastSuccess).toHaveBeenCalledWith('Dein Bild von Anna-Sonne wurde entfernt')
  })
})
