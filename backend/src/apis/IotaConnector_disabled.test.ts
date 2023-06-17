import { IotaClientSingleton } from '@/apis/IotaConnector'

jest.mock('@/config', () => ({
  CONFIG: { IOTA: false },
}))

describe('apis/IotaConnector/disabled', () => {
  it('getInstance return null if iota is disabled', () => {
    expect(IotaClientSingleton.getInstance()).toBeNull()
  })
})
