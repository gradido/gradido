import { getLogger } from 'config-schema/test/testSetup'
import { User, UserContact } from 'database'
import { HumHubClient } from '@/apis/humhub/HumHubClient'
import { GetUser } from '@/apis/humhub/model/GetUser'
import { LOG4JS_BASE_CATEGORY_NAME } from '@/config/const'
import { UpdateUserInfosArgs } from '@/graphql/arg/UpdateUserInfosArgs'
import { PublishNameType } from '@/graphql/enum/PublishNameType'
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

const logger = getLogger(`${LOG4JS_BASE_CATEGORY_NAME}.graphql.resolver.util.syncHumhub`)

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
    await syncHumhub(mockUpdateUserInfosArg, new User(), 'username')
    expect(HumHubClient.getInstance).not.toBeCalled()
    expect(logger.debug).toBeCalledTimes(1)
    expect(logger.info).toBeCalledTimes(0)
  })

  it('Should retrieve user from humhub and sync if relevant changes', async () => {
    mockUpdateUserInfosArg.firstName = 'New' // Relevant changes
    mockUser.firstName = 'New'
    await syncHumhub(mockUpdateUserInfosArg, mockUser, 'username')
    expect(logger.debug).toHaveBeenCalledTimes(4) // Four language logging calls, two debug calls in function, one for not syncing
    expect(logger.info).toHaveBeenLastCalledWith('finished sync user with humhub', {
      localId: mockUser.id,
      externId: mockHumHubUser.id,
      result: 'UPDATE',
    })
  })

  // Add more test cases as needed...
})
