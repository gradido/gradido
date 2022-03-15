import i18n from './i18n'
import VueI18n from 'vue-i18n'

jest.mock('vue-i18n')

describe('i18n', () => {
  it('calls i18n with locale en', () => {
    expect(VueI18n).toBeCalledWith(
      expect.objectContaining({
        locale: 'en',
      }),
    )
  })

  it('calls i18n with fallback locale en', () => {
    expect(VueI18n).toBeCalledWith(
      expect.objectContaining({
        fallbackLocale: 'en',
      }),
    )
  })

  it('has a  _t function', () => {
    expect(i18n).toEqual(
      expect.objectContaining({
        _t: expect.anything(),
      }),
    )
  })
})
