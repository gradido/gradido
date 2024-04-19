/* eslint-disable @typescript-eslint/no-empty-function */
import { User } from '@entity/User'
import { mocked } from 'ts-jest/utils'

import { HumHubClient } from './HumHubClient'
import { GetUser } from './model/GetUser'
import { syncUser, ExecutedHumhubAction } from './syncUser'

const defaultUser = User.create()

jest.mock('./HumHubClient', () => {
  return {
    HumHubClient: jest.fn().mockImplementation(() => {
      return {
        createUser: () => {},
        updateUser: () => {},
        deleteUser: () => {},
        getInstance: () => { return new HumHubClient() }
      }
    }),
  }
})

describe('syncUser function', () => {
  test('When humhubUser exists and user.humhubAllowed is false, should return DELETE action', async () => {
    const mockedHumhubClient = mocked(HumHubClient)
    const humhubUsers = new Map<string, GetUser>()

    defaultUser.humhubAllowed = false
    const result = await syncUser(defaultUser, new HumHubClient(), humhubUsers)

    expect(result).toBe(ExecutedHumhubAction.DELETE)
  })
})
