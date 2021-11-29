import i18n from './i18n'
import VueI18n from 'vue-i18n'

jest.mock('vue-i18n')

console.log(require)

describe('i18n', () => {
  it('does something', () => {
    expect(true).toBeTruthy()
  })
})
