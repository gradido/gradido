import { sendDataMessage, getMessage, getAllMessages } from '@/apis/IotaConnector'

jest.mock('@/config', () => ({
  CONFIG: { IOTA: false },
}))

describe('apis/IotaConnector/disabled', () => {
  describe('disabled', () => {
    it('sendDataMessage return null if iota is disabled', () => {
      expect(sendDataMessage('empty')).toBeNull()
    })
    it('getMessage return null if iota is disabled', () => {
      expect(getMessage('empty')).toBeNull()
    })
    it('getAllMessages return null if iota is disabled', () => {
      expect(getAllMessages()).toBeNull()
    })
  })
})
