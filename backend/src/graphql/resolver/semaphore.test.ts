/* eslint-disable @typescript-eslint/no-unsafe-member-access */
/* eslint-disable @typescript-eslint/no-unsafe-assignment */
/* eslint-disable @typescript-eslint/restrict-template-expressions */
import { Connection } from '@dbTools/typeorm'
import { ApolloServerTestClient } from 'apollo-server-testing'
import { Decimal } from 'decimal.js-light'
import { GraphQLError } from 'graphql'

import { cleanDB, testEnvironment, contributionDateFormatter } from '@test/helpers'

import { creationFactory, nMonthsBefore } from '@/seeds/factory/creation'
import { userFactory } from '@/seeds/factory/user'
import {
  confirmContribution,
  createContribution,
  createTransactionLink,
  redeemTransactionLink,
  login,
  createContributionLink,
  sendCoins,
} from '@/seeds/graphql/mutations'
import { bibiBloxberg } from '@/seeds/users/bibi-bloxberg'
import { bobBaumeister } from '@/seeds/users/bob-baumeister'
import { peterLustig } from '@/seeds/users/peter-lustig'

let mutate: ApolloServerTestClient['mutate'], con: Connection
let testEnv: {
  mutate: ApolloServerTestClient['mutate']
  query: ApolloServerTestClient['query']
  con: Connection
}

beforeAll(async () => {
  testEnv = await testEnvironment()
  mutate = testEnv.mutate
  con = testEnv.con
  await cleanDB()
})

afterAll(async () => {
  await cleanDB()
  await con.close()
})

describe('semaphore', () => {
  let contributionLinkCode = ''
  let bobsTransactionLinkCode = ''
  let bibisTransactionLinkCode = ''
  let bibisOpenContributionId = -1
  let bobsOpenContributionId = -1

  beforeAll(async () => {
    const now = new Date()
    await userFactory(testEnv, bibiBloxberg)
    await userFactory(testEnv, peterLustig)
    await userFactory(testEnv, bobBaumeister)
    await creationFactory(testEnv, {
      email: 'bibi@bloxberg.de',
      amount: 1000,
      memo: 'Herzlich Willkommen bei Gradido!',
      creationDate: nMonthsBefore(new Date()),
      confirmed: true,
    })
    await creationFactory(testEnv, {
      email: 'bob@baumeister.de',
      amount: 1000,
      memo: 'Herzlich Willkommen bei Gradido!',
      creationDate: nMonthsBefore(new Date()),
      confirmed: true,
    })
    await mutate({
      mutation: login,
      variables: { email: 'peter@lustig.de', password: 'Aa12345_' },
    })
    const {
      data: { createContributionLink: contributionLink },
    } = await mutate({
      mutation: createContributionLink,
      variables: {
        amount: new Decimal(200),
        name: 'Test Contribution Link',
        memo: 'Danke für deine Teilnahme an dem Test der Contribution Links',
        cycle: 'ONCE',
        validFrom: new Date(2022, 5, 18).toISOString(),
        validTo: new Date(now.getFullYear() + 1, 7, 14).toISOString(),
        maxAmountPerMonth: new Decimal(200),
        maxPerCycle: 1,
      },
    })
    contributionLinkCode = `CL-${contributionLink.code}`
    await mutate({
      mutation: login,
      variables: { email: 'bob@baumeister.de', password: 'Aa12345_' },
    })
    const {
      data: { createTransactionLink: bobsLink },
    } = await mutate({
      mutation: createTransactionLink,
      variables: {
        email: 'bob@baumeister.de',
        amount: 20,
        memo: 'Bobs Link',
      },
    })
    const {
      data: { createContribution: bobsContribution },
    } = await mutate({
      mutation: createContribution,
      variables: {
        creationDate: contributionDateFormatter(new Date()),
        amount: 200,
        memo: 'Bobs Contribution',
      },
    })
    await mutate({
      mutation: login,
      variables: { email: 'bibi@bloxberg.de', password: 'Aa12345_' },
    })
    const {
      data: { createTransactionLink: bibisLink },
    } = await mutate({
      mutation: createTransactionLink,
      variables: {
        amount: 20,
        memo: 'Bibis Link',
      },
    })
    const {
      data: { createContribution: bibisContribution },
    } = await mutate({
      mutation: createContribution,
      variables: {
        creationDate: contributionDateFormatter(new Date()),
        amount: 200,
        memo: 'Bibis Contribution',
      },
    })
    bobsTransactionLinkCode = bobsLink.code
    bibisTransactionLinkCode = bibisLink.code
    bibisOpenContributionId = bibisContribution.id
    bobsOpenContributionId = bobsContribution.id
  })

  it('creates a lot of transactions without errors', async () => {
    await mutate({
      mutation: login,
      variables: { email: 'bibi@bloxberg.de', password: 'Aa12345_' },
    })
    const bibiRedeemContributionLink = mutate({
      mutation: redeemTransactionLink,
      variables: { code: contributionLinkCode },
    })
    const redeemBobsLink = mutate({
      mutation: redeemTransactionLink,
      variables: { code: bobsTransactionLinkCode },
    })
    const bibisTransaction = mutate({
      mutation: sendCoins,
      variables: {
        recipientIdentifier: 'bob@baumeister.de',
        amount: '50',
        memo: 'Das ist für dich, Bob',
      },
    })
    await mutate({
      mutation: login,
      variables: { email: 'bob@baumeister.de', password: 'Aa12345_' },
    })
    const bobRedeemContributionLink = mutate({
      mutation: redeemTransactionLink,
      variables: { code: contributionLinkCode },
    })
    const redeemBibisLink = mutate({
      mutation: redeemTransactionLink,
      variables: { code: bibisTransactionLinkCode },
    })
    const bobsTransaction = mutate({
      mutation: sendCoins,
      variables: {
        recipientIdentifier: 'bibi@bloxberg.de',
        amount: '50',
        memo: 'Das ist für dich, Bibi',
      },
    })
    await mutate({
      mutation: login,
      variables: { email: 'peter@lustig.de', password: 'Aa12345_' },
    })
    const confirmBibisContribution = mutate({
      mutation: confirmContribution,
      variables: { id: bibisOpenContributionId },
    })
    const confirmBobsContribution = mutate({
      mutation: confirmContribution,
      variables: { id: bobsOpenContributionId },
    })
    await expect(bibiRedeemContributionLink).resolves.toMatchObject({ errors: undefined })
    await expect(redeemBobsLink).resolves.toMatchObject({ errors: undefined })
    await expect(bibisTransaction).resolves.toMatchObject({ errors: undefined })
    await expect(bobRedeemContributionLink).resolves.toMatchObject({ errors: undefined })
    await expect(redeemBibisLink).resolves.toMatchObject({ errors: undefined })
    await expect(bobsTransaction).resolves.toMatchObject({ errors: undefined })
    await expect(confirmBibisContribution).resolves.toMatchObject({ errors: undefined })
    await expect(confirmBobsContribution).resolves.toMatchObject({ errors: undefined })
  })

  describe('redeem transaction link twice', () => {
    let myCode: string

    beforeAll(async () => {
      await mutate({
        mutation: login,
        variables: { email: 'bibi@bloxberg.de', password: 'Aa12345_' },
      })
      const {
        data: { createTransactionLink: bibisLink },
      } = await mutate({
        mutation: createTransactionLink,
        variables: {
          amount: 20,
          memo: 'Bibis Link',
        },
      })
      myCode = bibisLink.code
      await mutate({
        mutation: login,
        variables: { email: 'bob@baumeister.de', password: 'Aa12345_' },
      })
    })

    it('does throw error on second redeem call', async () => {
      const result = await Promise.all([
        mutate({
          mutation: redeemTransactionLink,
          variables: {
            code: myCode,
          },
        }),
        mutate({
          mutation: redeemTransactionLink,
          variables: {
            code: myCode,
          },
        }),
      ])
      expect(result).toContainEqual(
        expect.objectContaining({
          errors: [new GraphQLError('Transaction link already redeemed')],
        }),
      )
      expect(result).toContainEqual(
        expect.objectContaining({
          errors: undefined,
        }),
      )
    })
  })
})
