import 'reflect-metadata'
import { Decimal } from 'decimal.js-light'

import { TestDB } from '@test/TestDB'

import { AccountType } from '@/graphql/enum/AccountType'
import { UserAccountDraft } from '@/graphql/input/UserAccountDraft'
import { UserIdentifier } from '@/graphql/input/UserIdentifier'
import { generateKeyPair, generateMnemonic } from '@/utils/cryptoHelper'

import { AccountFactory } from './Account.factory'
import { AccountRepository } from './Account.repository'
import { AddressType } from './proto/3_3/enum/AddressType'
import { UserFactory } from './User.factory'
import { UserLogic } from './User.logic'

const con = TestDB.instance

jest.mock('@typeorm/DataSource', () => ({
  getDataSource: jest.fn(() => TestDB.instance.dbConnect),
}))

describe('data/Account test factory and repository', () => {
  const now = new Date()
  const keyPair1 = generateKeyPair(generateMnemonic('62ef251edc2416f162cd24ab1711982b'))
  const keyPair2 = generateKeyPair(generateMnemonic('000a0000000002000000000003000070'))
  const keyPair3 = generateKeyPair(generateMnemonic('00ba541a1000020000000000300bda70'))
  const userGradidoID = '6be949ab-8198-4acf-ba63-740089081d61'

  describe('test factory methods', () => {
    beforeAll(async () => {
      await con.setupTestDB()
    })
    afterAll(async () => {
      await con.teardownTestDB()
    })

    it('test createAccount', () => {
      const account = AccountFactory.create(now, 1, AddressType.COMMUNITY_HUMAN, keyPair1)
      expect(account).toMatchObject({
        derivationIndex: 1,
        type: AddressType.COMMUNITY_HUMAN,
        createdAt: now,
        balanceCreatedAtDate: now,
        balanceConfirmedAt: new Decimal(0),
        balanceCreatedAt: new Decimal(0),
      })
    })

    it('test createAccountFromUserAccountDraft', () => {
      const userAccountDraft = new UserAccountDraft()
      userAccountDraft.createdAt = now.toISOString()
      userAccountDraft.accountType = AccountType.COMMUNITY_HUMAN
      userAccountDraft.user = new UserIdentifier()
      userAccountDraft.user.accountNr = 1
      const account = AccountFactory.createFromUserAccountDraft(userAccountDraft, keyPair1)
      expect(account).toMatchObject({
        derivationIndex: 1,
        type: AddressType.COMMUNITY_HUMAN,
        createdAt: now,
        balanceCreatedAtDate: now,
        balanceConfirmedAt: new Decimal(0),
        balanceCreatedAt: new Decimal(0),
      })
    })

    it('test createGmwAccount', () => {
      const account = AccountFactory.createGmwAccount(keyPair1, now)
      expect(account).toMatchObject({
        derivationIndex: 2147483649,
        type: AddressType.COMMUNITY_GMW,
        createdAt: now,
        balanceCreatedAtDate: now,
        balanceConfirmedAt: new Decimal(0),
        balanceCreatedAt: new Decimal(0),
      })
    })

    it('test createAufAccount', () => {
      const account = AccountFactory.createAufAccount(keyPair1, now)
      expect(account).toMatchObject({
        derivationIndex: 2147483650,
        type: AddressType.COMMUNITY_AUF,
        createdAt: now,
        balanceCreatedAtDate: now,
        balanceConfirmedAt: new Decimal(0),
        balanceCreatedAt: new Decimal(0),
      })
    })
  })

  describe('test repository functions', () => {
    beforeAll(async () => {
      await con.setupTestDB()

      await Promise.all([
        AccountFactory.createAufAccount(keyPair1, now).save(),
        AccountFactory.createGmwAccount(keyPair1, now).save(),
        AccountFactory.createAufAccount(keyPair2, now).save(),
        AccountFactory.createGmwAccount(keyPair2, now).save(),
        AccountFactory.createAufAccount(keyPair3, now).save(),
        AccountFactory.createGmwAccount(keyPair3, now).save(),
      ])
      const userAccountDraft = new UserAccountDraft()
      userAccountDraft.accountType = AccountType.COMMUNITY_HUMAN
      userAccountDraft.createdAt = now.toString()
      userAccountDraft.user = new UserIdentifier()
      userAccountDraft.user.accountNr = 1
      userAccountDraft.user.uuid = userGradidoID
      const user = UserFactory.create(userAccountDraft, keyPair1)
      const userLogic = new UserLogic(user)
      const account = AccountFactory.createFromUserAccountDraft(
        userAccountDraft,
        userLogic.calculateKeyPair(keyPair1),
      )
      account.user = user
      // user is set to cascade: ['insert'] will be saved together with account
      await account.save()
    })
    afterAll(async () => {
      await con.teardownTestDB()
    })
    it('test findAccountsByPublicKeys', async () => {
      const accounts = await AccountRepository.findByPublicKeys([
        Buffer.from('6c749f8693a4a58c948e5ae54df11e2db33d2f98673b56e0cf19c0132614ab59', 'hex'),
        Buffer.from('0fa996b73b624592fe326b8500cb1e3f10026112b374d84c87d097f4d489c019', 'hex'),
        Buffer.from('0ffa996b73b624592f26b850b0cb1e3f1026112b374d84c87d017f4d489c0197', 'hex'), // invalid
      ])
      expect(accounts).toHaveLength(2)
      expect(accounts).toMatchObject(
        expect.arrayContaining([
          expect.objectContaining({
            derivationIndex: 2147483649,
            derive2Pubkey: Buffer.from(
              '0fa996b73b624592fe326b8500cb1e3f10026112b374d84c87d097f4d489c019',
              'hex',
            ),
            type: AddressType.COMMUNITY_GMW,
          }),
          expect.objectContaining({
            derivationIndex: 2147483650,
            derive2Pubkey: Buffer.from(
              '6c749f8693a4a58c948e5ae54df11e2db33d2f98673b56e0cf19c0132614ab59',
              'hex',
            ),
            type: AddressType.COMMUNITY_AUF,
          }),
        ]),
      )
    })

    it('test findAccountByPublicKey', async () => {
      expect(
        await AccountRepository.findByPublicKey(
          Buffer.from('6c749f8693a4a58c948e5ae54df11e2db33d2f98673b56e0cf19c0132614ab59', 'hex'),
        ),
      ).toMatchObject({
        derivationIndex: 2147483650,
        derive2Pubkey: Buffer.from(
          '6c749f8693a4a58c948e5ae54df11e2db33d2f98673b56e0cf19c0132614ab59',
          'hex',
        ),
        type: AddressType.COMMUNITY_AUF,
      })
    })

    it('test findAccountByUserIdentifier', async () => {
      const userIdentifier = new UserIdentifier()
      userIdentifier.accountNr = 1
      userIdentifier.uuid = userGradidoID
      expect(await AccountRepository.findByUserIdentifier(userIdentifier)).toMatchObject({
        derivationIndex: 1,
        derive2Pubkey: Buffer.from(
          '2099c004a26e5387c9fbbc9bb0f552a9642d3fd7c710ae5802b775d24ff36f93',
          'hex',
        ),
        type: AddressType.COMMUNITY_HUMAN,
      })
    })
  })
})
