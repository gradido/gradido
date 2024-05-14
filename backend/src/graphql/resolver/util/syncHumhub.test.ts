import { User } from '@entity/User'
import { UserContact } from '@entity/UserContact'

import { HumHubClient } from '@/apis/humhub/HumHubClient'
import { GetUser } from '@/apis/humhub/model/GetUser'
import { UpdateUserInfosArgs } from '@/graphql/arg/UpdateUserInfosArgs'
import { PublishNameType } from '@/graphql/enum/PublishNameType'
import { backendLogger as logger } from '@/server/logger'

import { syncHumhub } from './syncHumhub'

jest.mock('@/apis/humhub/HumHubClient')
jest.mock('@/apis/humhub/syncUser')

const mockUser = new User()
mockUser.humhubAllowed = true
mockUser.emailContact = new UserContact()
mockUser.emailContact.email = 'email@gmail.com'
mockUser.humhubPublishName = PublishNameType.PUBLISH_NAME_FULL
const mockUpdateUserInfosArg = new UpdateUserInfosArgs()
const mockHumHubUser = new GetUser(mockUser, 1)

describe('syncHumhub', () => {
  beforeEach(() => {
    jest.spyOn(logger, 'debug').mockImplementation()
    jest.spyOn(logger, 'info').mockImplementation()
    jest.spyOn(HumHubClient, 'getInstance')
  })

  afterAll(() => {
    jest.resetAllMocks()
  })

  it('Should not sync if no relevant changes', async () => {
    await syncHumhub(mockUpdateUserInfosArg, new User())
    expect(HumHubClient.getInstance).not.toBeCalled()
    // language logging from some other place
    expect(logger.debug).toBeCalledTimes(5)
    expect(logger.info).toBeCalledTimes(0)
  })

  it('Should retrieve user from humhub and sync if relevant changes', async () => {
    mockUpdateUserInfosArg.firstName = 'New' // Relevant changes
    mockUser.firstName = 'New'
    await syncHumhub(mockUpdateUserInfosArg, mockUser)
    expect(logger.debug).toHaveBeenCalledTimes(8) // Four language logging calls, two debug calls in function, one for not syncing
    expect(logger.info).toHaveBeenLastCalledWith('finished sync user with humhub', {
      localId: mockUser.id,
      externId: mockHumHubUser.id,
      result: 'UPDATE',
    })
  })

  // Add more test cases as needed...
})
