import { IotaClientSingleton } from '@/client/IotaClientSingleton'
import CONFIG from '@/config'
import { logger } from '@/server/logger'

describe('apis/IotaClientSingleton/disabled', () => {
  beforeEach(() => {
    CONFIG.IOTA = false
  })
  it('getInstance return undefined if iota is disabled', () => {
    const spyLog = jest.spyOn(logger, 'info')
    expect(IotaClientSingleton.getInstance()).toBeUndefined()
    expect(spyLog).toHaveBeenCalledWith('Iota are disabled via config...')
  })
})

describe('apis/IotaClientSingleton/invalidIotaUrl', () => {
  beforeEach(() => {
    CONFIG.IOTA = true
    CONFIG.IOTA_API_URL = 'invalidUrl'
  })
  it('throw exception on invalid iota url', () => {
    // eslint-disable-next-line jest/unbound-method
    expect(IotaClientSingleton.getInstance).toThrow()
  })
})
